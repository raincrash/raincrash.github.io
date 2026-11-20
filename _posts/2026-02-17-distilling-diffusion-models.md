---
title: "Distilling Diffusion Models"
description: How distillation takes diffusion and flow models from fifty sampling steps down to one or two, the main families of methods, and what they trade away.
tags: [ml, diffusion, distillation]
image: /assets/og/posts/distilling-diffusion-models.png
---

The fastest way to take fifty steps is to learn where they end up.

In the [previous post](/how-diffusion-and-flow-models-work/) I went through how
diffusion and flow models turn noise into data: they learn a velocity field,
and sampling means solving an ODE along it. The number of steps you need comes
down to how curved the paths are. Flow matching and reflow make the paths
straighter, and get you from hundreds of steps to a few tens.

That's still too many for anything interactive. Getting to one or two steps
takes a different idea: train a second model to jump along the paths instead
of walking them. That's distillation, and it's what this post is about.

## The setup

The general recipe is the one from Hinton and colleagues' 2015 paper: a big,
slow _teacher_ produces targets, and a _student_ learns to match them. For
diffusion, the teacher isn't usually bigger than the student. It's often the
same architecture, initialised from the same weights. What's expensive is the
number of steps, so the student learns to cover more ground per step.

A quick recap of the notation from last time. Time runs from $$t = 0$$ (noise)
to $$t = 1$$ (data). The teacher gives us a velocity $$v(x_t, t)$$, and one
Euler step of size $$h$$ is

$$
x_{t+h} \approx x_t + h \, v(x_t, t)
$$

On a curved path, large steps overshoot, and the sample ends up as a blurry
average. Every method below is a different way of getting around that.

There are roughly four families.

## 1. Progressive distillation

Salimans and Ho (2022) had the simplest idea. Take a teacher that samples in
$$N$$ steps. Train a student so that **one** of its steps matches **two** of the
teacher's. Now the student samples in $$N/2$$ steps. Make it the new teacher and
repeat.

Each round halves the step count, so going from 1024 steps to 4 takes eight
rounds. It works well down to a handful of steps, but each round adds a little
error, and the rounds add up. One or two steps is where it starts to visibly
fall apart.

## 2. Guidance distillation

Almost every text-to-image model uses classifier-free guidance (Ho and Salimans,
2022). At each step you run the network twice, once with the prompt and once
without, and extrapolate:

$$
v_{\text{guided}} = v_{\text{uncond}} + w \, \big( v_{\text{cond}} - v_{\text{uncond}} \big)
$$

with a guidance scale $$w$$ that's usually well above 1. (Papers parametrise
$$w$$ differently; in this form, $$w = 1$$ means no guidance.) That doubles the cost
of every step. Meng et al. (2023) trained a student to produce
$$v_{\text{guided}}$$ in a single pass, with $$w$$ as an extra input. It's an
easy 2× on its own, and it's usually combined with one of the other methods.

## 3. Consistency models

Consistency models (Song, Dhariwal, Chen, Sutskever, 2023) attack the problem
from the end point rather than the step. Every point on an ODE trajectory ends
up at the same clean image. So learn a function $$f_\theta(x_t, t)$$ that maps
any point on a trajectory directly to that end point:

$$
\begin{gathered}
f_\theta(x_t, t) = f_\theta(x_{t'}, t') \quad \text{for } t, t' \text{ on one trajectory} \\
f_\theta(x, 1) = x
\end{gathered}
$$

The second condition (at the data end, the function is the identity) anchors it.
In _consistency distillation_, you take a noisy point $$x_{t_n}$$, use the teacher
to take one small ODE step towards the data to get $$\hat{x}_{t_{n+1}}$$, and ask
the student to give the same answer from both:

$$
\mathcal{L}_{\text{CD}} = \mathbb{E}\left[ d\big( f_\theta(x_{t_n}, t_n),\; f_{\theta^-}(\hat{x}_{t_{n+1}}, t_{n+1}) \big) \right]
$$

Here $$\theta^-$$ is a slowly updated (EMA) copy of the student, which stops
the target from chasing itself, and $$d$$ is a distance like L2 or LPIPS.
Consistency is passed along the trajectory one small step at a time, from the
anchored data end back to pure noise.

In code, one training step looks roughly like this (the paper uses a
second-order solver for the teacher step; Euler keeps it short):

```python
def consistency_distillation_loss(student, ema_student, teacher, x, t_n, t_next):
    eps = torch.randn_like(x)
    x_tn = t_n * x + (1 - t_n) * eps                 # noisy point
    with torch.no_grad():
        x_next = x_tn + (t_next - t_n) * teacher(x_tn, t_n)   # one teacher step
        target = ema_student(x_next, t_next)
    return ((student(x_tn, t_n) - target) ** 2).mean()
```

The result can sample in one step, and you can trade a few extra steps for
quality by re-noising and mapping again. Latent Consistency Models (Luo et al.,
2023) applied this to Stable Diffusion's latent space and got good images in
2 to 4 steps.

## 4. Distribution matching

The methods above all try to match the teacher's trajectories. The last family
gives that up and only asks that the student's outputs look like they came from
the same distribution as the teacher's.

Adversarial Diffusion Distillation (Sauer et al., 2023), behind SDXL Turbo, adds
a GAN-style discriminator on top of a distillation loss. The adversarial part
keeps one-step images sharp, which pure regression struggles with because it
blurs towards the average.

Distribution Matching Distillation (Yin et al., 2024) does something I find
more elegant. A one-step generator $$G_\theta$$ maps noise to images. We'd like
to minimise the KL divergence between the distribution of its outputs and the
real one. The gradient of that KL turns out to need only two score functions:

$$
\nabla_\theta \, D_{\text{KL}} \approx \mathbb{E}\left[ \big( s_{\text{fake}}(x_t) - s_{\text{real}}(x_t) \big) \frac{\partial x}{\partial \theta} \right], \qquad x = G_\theta(z)
$$

$$s_{\text{real}}$$ is just the frozen teacher. $$s_{\text{fake}}$$ is a second
diffusion model, trained on the fly to model whatever the generator is currently
producing. Where the two disagree, the generator gets pushed from the "fake"
direction towards the "real" one. Both are evaluated on noised versions
$$x_t$$ of the generated image, which keeps the gradients well behaved even
when the two distributions barely overlap. DMD2 (Yin et al., 2024) later added a
GAN loss and dropped the original regression term, and got to one- and four-step
models that were competitive with their many-step teachers.

## How they compare

| Method | Steps | What the student matches | Main weakness |
|---|---|---|---|
| Progressive distillation | 4-8 | Two teacher steps | Errors compound across rounds |
| Guidance distillation | Same as teacher | Guided output | Only removes the 2× from guidance |
| Reflow | 1-4 | Teacher's (noise, image) pairs | Generating pairs is expensive |
| Consistency distillation | 1-4 | Trajectory end point | Fiddly to tune, can look soft |
| Distribution matching / adversarial | 1-4 | Output distribution | Less diversity, harder to train |

Reflow, from the previous post, sits in the table because it's distillation in
disguise: the teacher's ODE produces the training pairs. In practice these
combine. InstaFlow used reflow and then distilled, and many few-step models
fold guidance distillation in as well.

## What you lose

None of this is free. The pattern is roughly: the fewer steps, the more you've
traded away.

- **Diversity.** The distribution-matching and adversarial methods tend to drift
  towards the most typical outputs, the same failure GANs are known for. Ask
  for "a dog" fifty times and you'll get fewer different dogs.
- **The teacher's mistakes.** The student can only be as good as the teacher,
  and in practice it's a little worse. Anything the teacher gets wrong (hands,
  text, physics in video) gets baked in.
- **Flexibility.** A teacher lets you trade steps for quality freely, change the
  guidance scale, or swap in a different sampler. A one-step student usually has
  the guidance scale baked in, and adding steps helps much less than you'd hope.
- **Compatibility.** LoRAs, ControlNets and other add-ons trained on the base
  model don't always carry over to the distilled one.
- **Evaluation.** Metrics like FID can stay flat while images get noticeably
  less varied or slightly plastic-looking. You have to actually look at a lot of
  samples.
- **Training cost.** Some of these, DMD in particular, keep several large models
  in memory at once: the student, the frozen teacher and the "fake" score model.
  Distillation is cheap at inference and expensive to set up.

## Closing thoughts

The two posts together tell one story. A diffusion model learns a velocity
field. Flow matching makes that field's paths straighter. Distillation teaches a
student to jump along them, or, in the case of distribution matching, to land
in the right place without caring how it got there.

For anything interactive, like real-time video, the step count is the whole
game. A model that takes 50 steps is a research demo. One that takes one or two
is something you can actually build on.

## References

- Hinton, Vinyals, Dean. [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531). 2015.
- Ho, Salimans. [Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598). 2022.
- Salimans, Ho. [Progressive Distillation for Fast Sampling of Diffusion Models](https://arxiv.org/abs/2202.00512). ICLR 2022.
- Meng et al. [On Distillation of Guided Diffusion Models](https://arxiv.org/abs/2210.03142). CVPR 2023.
- Song, Dhariwal, Chen, Sutskever. [Consistency Models](https://arxiv.org/abs/2303.01469). ICML 2023.
- Luo et al. [Latent Consistency Models](https://arxiv.org/abs/2310.04378). 2023.
- Sauer et al. [Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042). 2023.
- Liu et al. [InstaFlow: One Step is Enough for High-Quality Diffusion-Based Text-to-Image Generation](https://arxiv.org/abs/2309.06380). ICLR 2024.
- Yin et al. [One-step Diffusion with Distribution Matching Distillation](https://arxiv.org/abs/2311.18828). CVPR 2024.
- Yin et al. [Improved Distribution Matching Distillation for Fast Image Synthesis](https://arxiv.org/abs/2405.14867). NeurIPS 2024.
