---
title: "How Diffusion and Flow Models Work"
description: What diffusion and flow matching models actually learn, why sampling takes so many steps, and how straighter paths make it faster.
tags: [ml, diffusion, generative-models]
image: /assets/og/posts/how-diffusion-and-flow-models-work.png
---

It takes a diffusion model fifty steps to do something that, in principle, could
take one.

Image and video generators have become absurdly good, but they're still slow in a
very particular way. A single network evaluation isn't the problem; it's that
you have to run the network over and over, nudging a block of noise a little
closer to a picture each time.

I've been reading (and re-reading) a lot of the papers on this for work, and the
ideas fit together more neatly than the notation suggests. This post is the
version I wish I'd had at the start: what diffusion and flow models actually
learn, and why sampling takes so many steps. In the
[next post](/distilling-diffusion-models/) I'll get to how distillation cuts
that number down to one or two.

## First, the problem

A generative model has one job: take samples from an easy distribution, like
Gaussian noise, and turn them into samples from a hard one, like "photos of
dogs".

GANs do this in a single forward pass. A generator network maps noise
straight to an image, and a discriminator tells it when it's wrong. It's fast,
but famously hard to train: the two networks fight, training can collapse, and
the generator often learns to produce a few convincing kinds of output rather
than the full variety of the data.

Diffusion models take the slow, stable route. Rather than learning the whole
mapping at once, they learn a lot of small, easy steps. Training is just
regression, it's very stable, and it covers the data distribution well. The
cost is paid at sampling time.

## Diffusion in one equation

Pick a clean sample $$x$$ from the data and some Gaussian noise
$$\epsilon \sim \mathcal{N}(0, I)$$. Diffusion models define a family of noisy
versions of $$x$$, indexed by a time $$t$$:

$$
x_t = \alpha_t \, x + \sigma_t \, \epsilon
$$

At one end of time, $$x_t$$ is pure noise. At the other end, it's the clean
sample. In between, it's a blend. Different papers pick different schedules
for $$\alpha_t$$ and $$\sigma_t$$, and (annoyingly) different directions for
time. In this post I'll use $$t = 0$$ for noise and $$t = 1$$ for data
throughout, because it makes the flow-matching part read more naturally.

The network $$\epsilon_\theta(x_t, t)$$ is trained to look at a noisy sample and
predict the noise that was added:

$$
\mathcal{L} = \mathbb{E}_{x, \epsilon, t} \left[ \lVert \epsilon_\theta(x_t, t) - \epsilon \rVert^2 \right]
$$

That's it. No adversary, no likelihood bound you have to wrestle with in
practice, just "here's a noisy image, what was the noise?". The original DDPM
paper (Ho et al., 2020) used 1000 noise levels and, to generate an image,
walked back through all 1000 of them.

### Why sampling needs many steps

Knowing the noise at every level is equivalent to knowing the _score_, the
direction in which the data gets more likely. Song et al. (2021) showed that
for every diffusion model there's an ordinary differential equation, the
_probability flow ODE_, whose solutions carry noise to data deterministically.
Sampling is then just numerically solving an ODE:

$$
\frac{dx_t}{dt} = v(x_t, t)
$$

where the velocity field $$v$$ is computed from the network's output. DDIM
(Song, Meng, Ermon, 2021) is essentially a good solver for this ODE and brings
1000 steps down to around 50.

Why not one step? Because the trajectories are curved. The simplest ODE solver,
Euler's method, assumes the velocity is constant over the step:

$$
x_{t+h} \approx x_t + h \, v(x_t, t)
$$

On a curved path, each step overshoots the bend, and the error grows with the
step size $$h$$. Take big steps on a curved road and you end up in a ditch. In
image terms, the ditch is a blurry average of all the pictures you could have
generated.

So there are two ways to speed things up: make the road straighter, or teach a
model to skip straight to the end of it. This post is about the first.

## Flow matching

Flow matching (Lipman et al., 2023), rectified flow (Liu, Gong, Liu, 2023) and
stochastic interpolants (Albergo and Vanden-Eijnden, 2023) arrived at roughly the
same idea at roughly the same time, from three different directions. The
version I find easiest to hold in my head is this:

**Draw a straight line from the noise to the data and learn to walk along it.**

Take the simplest possible schedule, $$\alpha_t = t$$ and $$\sigma_t = 1 - t$$:

$$
x_t = t \, x + (1 - t) \, \epsilon
$$

At $$t = 0$$ you're at the noise sample, at $$t = 1$$ you're at the data sample,
and you move between them at constant speed. Differentiate with respect to $$t$$
and the velocity along that line is

$$
\frac{dx_t}{dt} = x - \epsilon
$$

So we train a network $$v_\theta(x_t, t)$$ to predict exactly that:

$$
\mathcal{L}_{\text{FM}} = \mathbb{E}_{x, \epsilon, t} \left[ \lVert v_\theta(x_t, t) - (x - \epsilon) \rVert^2 \right]
$$

The whole training loop fits on a screen:

```python
import torch

def flow_matching_loss(model, x):
    """x: (B, C, H, W) batch of clean data."""
    eps = torch.randn_like(x)
    t = torch.rand(x.shape[0], device=x.device).view(-1, 1, 1, 1)
    x_t = t * x + (1 - t) * eps          # point on the straight line
    target = x - eps                      # constant velocity along it
    return ((model(x_t, t) - target) ** 2).mean()
```

And sampling is plain Euler integration from noise to data:

```python
@torch.no_grad()
def sample(model, shape, steps=50):
    x = torch.randn(shape)
    ts = torch.linspace(0, 1, steps + 1)
    for t0, t1 in zip(ts[:-1], ts[1:]):
        x = x + (t1 - t0) * model(x, t0.expand(shape[0]))
    return x
```

### Noise, data or velocity: same thing

It's worth noticing that predicting noise, predicting the clean image and
predicting the velocity are all the same information. Given $$x_t$$ and a
predicted velocity $$v = x - \epsilon$$, you can recover both:

$$
x = x_t + (1 - t)\, v, \qquad \epsilon = x_t - t\, v
$$

(Substitute $$x_t = t x + (1-t)\epsilon$$ and check; it's two lines.) So flow
matching isn't a different kind of model from diffusion. It's a particular
choice of noise schedule and of what the network outputs. That choice turns out
to matter a lot in practice, which is why Stable Diffusion 3 (Esser et al., 2024)
and a lot of recent image and video models train with it.

### The catch: the lines cross

If each training pair moves in a straight line, why isn't one Euler step
enough?

Because the network never sees which pair a point belongs to. Lots of different
(noise, data) pairs have lines passing through the same $$x_t$$, heading in
different directions. A network trained with squared error learns the average:

$$
v^\ast(z, t) = \mathbb{E}\left[\, x - \epsilon \;\middle\vert\; x_t = z \,\right]
$$

Each individual line is straight, but the averaged field that the network
learns isn't. Its trajectories bend as they go, steering around each other
where lines would otherwise cross. They're much straighter than a typical
diffusion trajectory, which is why flow models do well in 20 to 30 steps, but
they're not straight enough for one.

### Reflow: straightening the road

Rectified flow has a neat fix. Once you have a trained model, generate a big
set of pairs by running its ODE: start from noise $$\epsilon$$, integrate to get
an image $$\hat{x}$$. These pairs come from following the model's own
trajectories, and an ODE's trajectories never cross. Now train a new flow model
on the pairs $$(\epsilon, \hat{x})$$ instead of random pairings.

Because the pairs no longer cross, the averaging problem mostly goes away and
the new model's paths are much straighter. Repeat once or twice and a
single Euler step starts to give something reasonable. InstaFlow (Liu et al.,
2024) used this on Stable Diffusion, then distilled the result, to get a usable
one-step text-to-image model.

## What you lose

Flow matching is a cleaner way to train, not a free lunch.

- **It's still an ODE.** Straighter paths mean fewer steps, not one step. Out of
  the box you're still looking at tens of network evaluations per sample.
- **The time sampling matters more than it looks.** My code samples $$t$$
  uniformly, but the hardest part of the problem is in the middle, where the
  image is half noise and half structure. Stable Diffusion 3 samples $$t$$ from
  a logit-normal distribution to spend more training there, and found it
  mattered.
- **Reflow is expensive.** You have to run the full sampler to generate every
  training pair, and each round of reflow trains on the previous model's
  outputs, mistakes included. Errors can pile up from one round to the next.
- **Deterministic sampling.** Solving the ODE maps each noise sample to exactly
  one output. That's convenient, but stochastic samplers, which add a bit of
  fresh noise along the way, can correct errors that an ODE solver just carries
  forward (Karras et al., 2022, have a good discussion of this).

## Closing thoughts

What I like about this area is how much of it comes down to geometry. A
diffusion model learns a velocity field. The number of steps you need is mostly
a question of how curved that field's paths are. Flow matching picks the
simplest possible paths during training, and reflow straightens what's left.

Straightening the road only gets you so far, though. To get from tens of steps
to one or two, you need to teach a second model to jump. That's
[distillation](/distilling-diffusion-models/), and it's the next post.

## References

- Ho, Jain, Abbeel. [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239). NeurIPS 2020.
- Song, Meng, Ermon. [Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502). ICLR 2021.
- Song et al. [Score-Based Generative Modeling through Stochastic Differential Equations](https://arxiv.org/abs/2011.13456). ICLR 2021.
- Karras, Aittala, Aila, Laine. [Elucidating the Design Space of Diffusion-Based Generative Models](https://arxiv.org/abs/2206.00364). NeurIPS 2022.
- Lipman et al. [Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747). ICLR 2023.
- Liu, Gong, Liu. [Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003). ICLR 2023.
- Albergo, Vanden-Eijnden. [Building Normalizing Flows with Stochastic Interpolants](https://arxiv.org/abs/2209.15571). ICLR 2023.
- Liu et al. [InstaFlow: One Step is Enough for High-Quality Diffusion-Based Text-to-Image Generation](https://arxiv.org/abs/2309.06380). ICLR 2024.
- Esser et al. [Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206). ICML 2024.
