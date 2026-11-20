---
title: "The Teacher Doesn't Need to Be in the Room: Distilling Video Models into a Tiny Controller"
description: How a ~1M-parameter model distilled from a video generation model steers an avatar's expressions in real time, why small wins, and what you lose.
seo_title: Distilling Video Models into a Tiny Real-Time Controller
image: /assets/og/posts/distilling-video-models-into-a-tiny-controller.png
tags: [ml, distillation, avatars]
---

The best teacher is a slow one.

Video generation models have quietly become the world's best experts on how
human faces move. Ask one for "a woman slowly breaking into a surprised smile"
and you get a clip where the eyebrows lift a beat before the mouth opens, the
cheeks rise, the eyes narrow just so. That knowledge was learned from an absurd
amount of footage, and it lives in billions of parameters.

It's also hopelessly slow. Generating a few seconds of video takes anywhere
from seconds to minutes on a large GPU. A real-time avatar has about
33 milliseconds per frame, and most of that is already spoken for.

I've spent a good part of the last year on a version of this problem: getting
that knowledge out of the big model and into something small enough to run
every frame. The answer turned out to be a model with about a million
parameters. This post is about the general idea, why the tiny model wins, and
what it quietly gives up.

## First, the setup

Say you already have a fast, photorealistic avatar. In an
[earlier post](/gaussian-splatting-for-avatars/) I described one way to
build it: a cloud of 3D Gaussians rigged to a parametric face model like
[FLAME](https://flame.is.tue.mpg.de/). The important property is that the
avatar is driven by a small vector of numbers per frame: expression
coefficients, jaw rotation, eyelids, a bit of head pose. Call it
\\( \boldsymbol{\psi}_t \in \mathbb{R}^{d} \\), with \\( d \\) around 100.

Lip sync already comes from audio. What's missing is everything else: the
_emotion_. You want to say "warm and a little amused" or "concerned" and have
the face follow, smoothly, while the avatar is talking.

So the job is a function from a description to a trajectory:

$$
f_\theta : (\text{prompt}, \text{intensity}, \text{history}) \mapsto \boldsymbol{\psi}_{t+1}
$$

and it has to run in well under a millisecond.

## The key insight: don't distill the pixels

The naive way to use a video model here is to generate video and render it. That
fails twice: it's far too slow, and the output isn't _your_ avatar. It's some
other person in some other room. Cutting the teacher down to a few sampling
steps, as in my [last post](/distilling-diffusion-models/), only chips away at
the first problem: it's still a large model producing someone else's pixels.

The useful observation is that we don't need the teacher's pixels at all. We
already have a renderer. What we need is the teacher's understanding of _how
expressions unfold over time_, and that can be expressed in the same ~100
numbers that drive the avatar.

So instead of distilling the model, we distill the motion.

### Step 1: let the teacher generate

Write a large, varied set of prompts covering emotions, intensities and
transitions: "neutral to delighted", "skeptical, slight frown", "trying not to
laugh". Generate many short, front-facing talking-head clips for each, with
different seeds and identities. This is the expensive part, but it happens once,
offline, and it parallelizes trivially.

### Step 2: lift pixels into parameters

Run a monocular face tracker over every generated clip to recover the
parameters that best explain each frame. Methods like
[DECA](https://deca.is.tue.mpg.de/) and
[EMOCA](https://emoca.is.tue.mpg.de/) regress FLAME parameters from images, and
EMOCA in particular was designed to preserve emotional content. Each clip
becomes a trajectory \\( \boldsymbol{\psi}_{1:T} \\) paired with the prompt that
produced it:

$$
\mathcal{D} = \left\{ \left( c_i, \boldsymbol{\psi}^{(i)}_{1:T} \right) \right\}_{i=1}^{N}
$$

This is the step that makes everything else possible. Millions of pixels per
frame collapse into a hundred numbers. Identity, lighting, background and camera
all disappear, because the avatar will supply its own.

Throw away a lot here. Clips where the face is small, turned away, occluded or
where the tracker is unsure are worse than no data at all.

### Step 3: train a tiny student

Now the student only has to learn a mapping between two small spaces. The
prompt goes through a frozen text encoder _once_ (not per frame) and gets
cached. The model itself is a small recurrent network that predicts the next
frame's parameters from the conditioning and the previous state:

```python
import torch
import torch.nn as nn

class ExpressionController(nn.Module):
    def __init__(self, text_dim=512, cond_dim=128, out_dim=100, hidden=256):
        super().__init__()
        self.cond = nn.Sequential(nn.Linear(text_dim + 1, cond_dim), nn.SiLU())
        self.gru = nn.GRU(cond_dim + out_dim, hidden, num_layers=2, batch_first=True)
        self.head = nn.Linear(hidden, out_dim)

    def forward(self, text_emb, intensity, prev, h=None):
        c = self.cond(torch.cat([text_emb, intensity], dim=-1))
        x = torch.cat([c, prev], dim=-1).unsqueeze(1)   # one frame at a time
        y, h = self.gru(x, h)
        return prev + self.head(y.squeeze(1)), h        # predict a delta

model = ExpressionController()
print(sum(p.numel() for p in model.parameters()))  # 859,492
```

That's about 0.86M parameters. Predicting a _delta_ from the previous frame
instead of an absolute pose makes the output smooth by construction.

The loss is plain regression on the parameters plus a term that matches the
teacher's velocities, which is what makes motion feel alive rather than
correct-but-robotic:

$$
\mathcal{L} = \sum_{t} \left\lVert \hat{\boldsymbol{\psi}}_t - \boldsymbol{\psi}_t \right\rVert^2
+ \lambda \sum_{t} \left\lVert \Delta\hat{\boldsymbol{\psi}}_t - \Delta\boldsymbol{\psi}_t \right\rVert^2,
\qquad
\Delta\boldsymbol{\psi}_t = \boldsymbol{\psi}_{t+1} - \boldsymbol{\psi}_t
$$

The intensity input is a free knob: scale it during training by mixing
trajectories with a neutral baseline, and at runtime you can dial "a bit
surprised" up to "very surprised" without a new prompt.

## Why small models win in real time

It's tempting to see the student as a compromised copy of the teacher. In a
real-time system, it's the other way around. For this job the student is
_better_, in ways that matter more than raw quality.

**Latency.** A forward pass is roughly two FLOPs per parameter, so about
1.7 MFLOPs per frame. That's microseconds on a GPU and comfortably real-time on
a CPU. The teacher, with billions of parameters, many denoising steps and
large latent videos per clip, is millions of times more expensive
_per second of output_. No amount of engineering closes that gap.

**Causality.** The student is causal: it updates every frame, using only the
past. Change the prompt halfway through a sentence and the face starts
changing on the next frame. A video model generates whole clips at once; making
it react mid-clip is a research problem of its own.

**Stability.** Because the output is a low-dimensional parameter vector and the
avatar renders it, there's no flicker, no identity drift, no melting hands. All
the visual consistency comes from the renderer. The controller can't break the
face. It can only move it.

**Control.** Intensity knobs, blending two prompts, smoothly interpolating
between emotions, clamping a parameter that looks wrong: all trivial when your
output is a hundred interpretable numbers, all hard when it's pixels.

**Cost.** A model this size barely registers next to the renderer. Every
millisecond and megabyte you don't spend on control is one you can spend on
more concurrent sessions per GPU.

The general pattern is worth stating plainly: **use the big model as a data
generator, not a runtime component.** Its knowledge is the valuable part. Its
architecture doesn't need to come along.

## What you lose

Of course none of this is free. The student is only as good as the pipeline
that fed it, and several things get lost along the way.

**Anything outside the parameter space.** If FLAME can't express it, the
student can't either. Puffed cheeks, wrinkles that appear with a real smile,
the tongue, tears, a subtle asymmetric smirk: the teacher generated them, the
tracker couldn't represent them, and they're gone. The bottleneck is a feature
right up until it isn't.

**Tracker errors become ground truth.** The student learns from the tracker's
reading of the teacher, not from the teacher. Monocular trackers have biases.
Eyelids, lip corners and subtle brow motion are exactly the places they tend to
be least reliable, and exactly where emotion lives. Whatever the tracker gets
systematically wrong, the student learns faithfully.

**Mode averaging.** There are many valid ways to be "amused". An MSE loss
doesn't pick one; it averages them, and the average of many expressive faces is
a bland one. You can fight this by conditioning on a small random style code,
predicting residuals around a neutral baseline, or swapping the regression head
for a small generative one, but you have to fight it.

**The teacher's taste.** Video models learned emotion from stock footage and the
internet. Their "happy" can be a bit performative, their "sad" a bit
theatrical, and their range narrower for some faces than others. The student
inherits these habits, and because it's small, it compresses them into
something even more uniform.

**Generalization.** The teacher can handle "smug, but tired, trying to hide it".
The student has only seen the prompts you generated. Between them, a good text
embedding lets it interpolate. Outside them, it guesses, and often guesses
"neutral".

**Short memory.** A small causal model reacts well but plans badly. Long
emotional arcs, like a slow build over a whole paragraph, are hard to get
without some higher-level signal deciding where the conversation is going.

## Making it work in practice

A few things that mattered more than architecture:

- **Curate the teacher's output ruthlessly.** Filter by tracker confidence,
  face size and head pose. Drop clips with cuts. A smaller clean dataset beat a
  larger noisy one every time.
- **Normalize per identity.** Subtract each generated person's neutral
  expression so the student learns _changes_, not faces.
- **Split the face.** Let audio drive the mouth and the controller drive the
  upper face and overall mood, then blend. Two specialists beat one generalist
  fighting over the jaw.
- **Look at it.** Parameter-space metrics are useful for catching regressions
  and almost useless for judging whether an expression feels right. Watch a lot
  of rendered output.

## Closing thoughts

Distillation is an old idea; Hinton and colleagues wrote the classic paper in
2015. What's changed is the teacher. Large generative models now hold a kind of
knowledge that used to need motion capture studios and animators: how people
look when they feel things. The trick is realizing you can borrow that
knowledge without inviting the model into your real-time loop.

The teacher does its work offline, once. At runtime, a model you could fit in a
few megabytes does the talking.

## References

- Hinton, Vinyals, Dean. [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531). NeurIPS Deep Learning Workshop, 2015.
- Li et al. [Learning a model of facial shape and expression from 4D scans (FLAME)](https://flame.is.tue.mpg.de/). SIGGRAPH Asia 2017.
- Feng, Feng, Black, Bolkart. [Learning an Animatable Detailed 3D Face Model from In-the-Wild Images (DECA)](https://deca.is.tue.mpg.de/). SIGGRAPH 2021.
- Daněček, Black, Bolkart. [EMOCA: Emotion Driven Monocular Face Capture and Animation](https://emoca.is.tue.mpg.de/). CVPR 2022.
- Blattmann et al. [Stable Video Diffusion: Scaling Latent Video Diffusion Models to Large Datasets](https://arxiv.org/abs/2311.15127). 2023.
- Qian et al. [GaussianAvatars: Photorealistic Head Avatars with Rigged 3D Gaussians](https://shenhanqian.github.io/gaussian-avatars). CVPR 2024.
