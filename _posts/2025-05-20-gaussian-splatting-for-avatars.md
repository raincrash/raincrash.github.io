---
title: "Fuzzy Blobs All the Way Down: Gaussian Splatting for Avatars"
description: What 3D Gaussian Splatting is, why it beats meshes and NeRFs for real-time digital humans, and where it still falls apart.
tags: [3d, graphics, avatars]
seo_title: Gaussian Splatting for Avatars, Explained
image: /assets/og/posts/gaussian-splatting-for-avatars.png
---

Your face is a cloud of fuzzy blobs. At least, that's the most useful way I've
found to think about it when the goal is rendering a photorealistic human at
30 frames per second.

For most of the history of computer graphics, digital humans were built from
triangles. Then neural radiance fields showed that you could skip the triangles
and learn the whole thing as a continuous function. And then, in 2023, 3D
Gaussian Splatting came along and showed that a few hundred thousand small,
coloured, semi-transparent ellipsoids could beat both, at least for a large class
of problems. Avatars turned out to be one of them.

In this post I want to walk through what Gaussian Splatting actually is, why it
fits real-time avatars so well, and, just as importantly, where it still breaks.

## First, the problem

Let's be concrete about what "real-time photorealistic avatar" means. You want a
person, rendered from a camera that may move, with a face that talks and emotes,
at somewhere between 25 and 60 frames per second, ideally while sharing a GPU
with other models. Every frame has a budget of a few tens of milliseconds, and
rendering only gets a slice of it.

Three families of representation compete for that slice.

### Meshes

A textured triangle mesh is the classic answer, and it is _fast_. GPUs have
been built around rasterizing triangles for decades. Parametric body and face
models like [SMPL](https://smpl.is.tue.mpg.de/) and
[FLAME](https://flame.is.tue.mpg.de/) give you a mesh that you can pose and
animate with a handful of parameters. I spent a few years fitting SMPL bodies
to scans, and I still think it's one of the most elegant ideas in the field.

The catch is photorealism. Hair, eyelashes, the inside of the mouth, the soft
translucency of skin: none of these are well described by a surface with a
texture painted on it. Getting a mesh to look truly real takes artists, careful
shaders and a lot of time.

### Neural Radiance Fields

[NeRF](https://www.matthewtancik.com/nerf) takes the opposite route. Instead
of a surface, the scene is a continuous volume: a neural network maps a 3D
position \\( \mathbf{x} \\) and viewing direction \\( \mathbf{d} \\) to a density
\\( \sigma \\) and a colour \\( \mathbf{c} \\). A pixel's colour is the volume
rendering integral along its camera ray \\( \mathbf{r}(t) = \mathbf{o} + t\mathbf{d} \\):

$$
C(\mathbf{r}) = \int_{t_n}^{t_f} T(t)\, \sigma(\mathbf{r}(t))\, \mathbf{c}(\mathbf{r}(t), \mathbf{d})\, dt,
\qquad
T(t) = \exp\!\left( -\int_{t_n}^{t} \sigma(\mathbf{r}(s))\, ds \right)
$$

\\( T(t) \\) is the transmittance: how much light survives from the camera up to
depth \\( t \\) without being absorbed.

This is gorgeous for photorealism, because nothing forces the scene to be a
surface. Fuzzy hair and soft edges are just regions of low density. But it's
expensive: estimating that integral means sampling dozens to hundreds of points
along every ray and querying the network at each one. Even with clever
acceleration structures like Instant-NGP, hitting real-time rates at high
resolution is a fight.

## Enter the blobs

[3D Gaussian Splatting](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)
(Kerbl et al., SIGGRAPH 2023) keeps the volumetric, soft look of NeRF but throws
away the neural network and the ray marching. The scene becomes an explicit,
unordered set of 3D Gaussians. Each one carries:

- a **mean** \\( \boldsymbol{\mu} \in \mathbb{R}^3 \\), its position,
- a **covariance** \\( \Sigma \in \mathbb{R}^{3 \times 3} \\), its shape and orientation,
- an **opacity** \\( \alpha \in [0, 1] \\),
- a **colour**, stored as spherical harmonic coefficients so it can change with viewing direction.

The density of a single Gaussian at a point \\( \mathbf{x} \\) is the familiar

$$
G(\mathbf{x}) = \exp\!\left( -\tfrac{1}{2} (\mathbf{x} - \boldsymbol{\mu})^\top \Sigma^{-1} (\mathbf{x} - \boldsymbol{\mu}) \right)
$$

### Keeping the covariance honest

You can't just let an optimizer push the nine entries of \\( \Sigma \\) around:
a covariance matrix has to be symmetric and positive semi-definite, and gradient
descent has no idea. The trick is to factor it into a rotation \\( R \\) (stored
as a quaternion) and a per-axis scale \\( S = \operatorname{diag}(s_x, s_y, s_z) \\):

$$
\Sigma = R\, S\, S^\top R^\top
$$

Any rotation and any scale give you a valid ellipsoid, so the optimizer is free
to do whatever it wants. In PyTorch this is a few lines:

```python
import torch
import torch.nn.functional as F

def build_covariance(quat, log_scale):
    """quat: (N, 4) as (w, x, y, z), log_scale: (N, 3) -> (N, 3, 3)"""
    w, x, y, z = F.normalize(quat, dim=-1).unbind(-1)
    R = torch.stack([
        1 - 2*(y*y + z*z), 2*(x*y - w*z),     2*(x*z + w*y),
        2*(x*y + w*z),     1 - 2*(x*x + z*z), 2*(y*z - w*x),
        2*(x*z - w*y),     2*(y*z + w*x),     1 - 2*(x*x + y*y),
    ], dim=-1).view(-1, 3, 3)
    M = R * torch.exp(log_scale)[:, None, :]   # R @ S
    return M @ M.transpose(1, 2)               # R S S^T R^T
```

Storing the scale in log-space keeps it positive and makes the optimization
better behaved.

### Splatting: from 3D blobs to 2D pixels

Here is the part that makes it fast. Instead of marching rays through the
volume, each Gaussian is _projected_ onto the image plane, where it becomes a 2D
Gaussian (a "splat"). The projected covariance follows the EWA splatting
formulation from Zwicker et al. (2001):

$$
\Sigma' = J\, W\, \Sigma\, W^\top J^\top
$$

where \\( W \\) is the world-to-camera transform and \\( J \\) is the Jacobian of
the local affine approximation of the perspective projection. Then the pixel
colour is plain front-to-back alpha compositing over the \\( N \\) splats that
overlap the pixel, sorted by depth:

$$
C = \sum_{i=1}^{N} \mathbf{c}_i\, \alpha_i' \prod_{j=1}^{i-1} \left( 1 - \alpha_j' \right)
$$

Here \\( \alpha_i' \\) is the Gaussian's opacity multiplied by its 2D falloff at
that pixel.

If this looks familiar, it should: it's a discretized version of the NeRF
integral above. The product term is the transmittance. The difference is that
the "samples" are a small set of explicit primitives that we can sort once per
frame and blend on a tile-based rasterizer, rather than hundreds of network
queries per ray. The whole pipeline is differentiable, so we can optimize every
Gaussian's parameters directly from photos with gradient descent.

### Growing and pruning

Starting from a sparse point cloud, the optimization also changes _how many_
Gaussians there are. In under-reconstructed regions, small Gaussians are cloned;
large Gaussians covering too much detail are split into smaller ones; nearly
transparent ones are pruned. The representation grows detail exactly where the
images demand it.

The result: quality on par with the best NeRFs, at real-time frame rates on a
single consumer GPU. Training in tens of minutes, rather than the many hours
the best NeRFs needed, helped everyone adopt it quickly, too.

## From scenes to people

The original paper is about _static_ scenes. A person is anything but static.
The key question for avatars is: **how do you make the blobs move?**

The answer most methods converge on is wonderfully pragmatic: **don't throw away
the mesh, ride on it.** Take a parametric model like FLAME for heads or SMPL for
bodies, which already knows how to pose and express, and attach the Gaussians
to it.

### Rigging Gaussians to a template

Parametric models deform their vertices with linear blend skinning (LBS). A
point \\( \mathbf{x} \\) in the canonical (rest) pose is moved by a weighted mix of
the rigid transforms \\( (R_k, \mathbf{t}_k) \\) of the \\( K \\) joints:

$$
\mathbf{x}' = \sum_{k=1}^{K} w_k \left( R_k\, \mathbf{x} + \mathbf{t}_k \right)
$$

Apply the same idea to each Gaussian's mean, and rotate its covariance with the
local frame so the ellipsoid turns along with the skin:

$$
\boldsymbol{\mu}' = \sum_{k} w_k \left( R_k \boldsymbol{\mu} + \mathbf{t}_k \right),
\qquad
\Sigma' = \tilde{R}\, \Sigma\, \tilde{R}^\top
$$

where \\( \tilde{R} \\) is the blended (and re-orthonormalized) rotation.
[GaussianAvatars](https://shenhanqian.github.io/gaussian-avatars) (Qian et al.,
CVPR 2024) does a neat variant of this for heads: every Gaussian is bound to a
triangle of the FLAME mesh and lives in that triangle's local coordinate
frame. When FLAME moves its jaw or raises an eyebrow, the triangles move, and
the Gaussians move with them for free. Similar ideas power full-body methods
that bind Gaussians to SMPL.

### Correcting what the template can't

A template mesh only knows so much. FLAME has no teeth, no tongue, no wrinkles
that appear when you smile. So most avatar methods add a small learned
correction on top: an offset to each Gaussian's position, rotation, scale or
colour, conditioned on the expression and pose parameters. That network can be
tiny, because it only needs to model the _residual_ the template got wrong, and
it's cheap enough to run every frame.

This is the part I find most exciting. The template gives you control and
structure; the Gaussians give you realism; a small model glues the two
together. You get something you can drive in real time from a few dozen
parameters, which you can in turn predict from audio, text or a video of
someone else.

## Why it fits real-time avatars so well

Putting it together, Gaussian avatars hit a sweet spot:

- **Speed.** Rasterizing sorted splats is far cheaper than ray marching a
  network, so the renderer takes only a few milliseconds of the frame budget.
- **Photorealism.** Soft, semi-transparent primitives handle hair, skin and
  fuzzy edges much better than a single textured surface.
- **Controllability.** Riding on a parametric model means the avatar speaks the
  same language as decades of animation tooling: poses, expressions, blendshapes.
- **Explicitness.** Each Gaussian is just a row of numbers: position, rotation,
  scale, opacity, colour. You can inspect them, edit them, cull them or stream
  them. Try doing that with the weights of an MLP.

## Where it still falls apart

None of this is magic, and it's worth being honest about the rough edges.

**Mouths are hard.** Teeth, tongue and the inside of the mouth are barely
visible in training data and poorly supported by the template. This is where you
most often see blur, floating blobs or teeth that slide around.

**Lighting is baked in.** The colour of each Gaussian is learned under the
lighting of the capture. Put the avatar in a different room and it still looks
like it's sitting in the studio. Relightable Gaussian avatars are an active
research area, but far from solved.

**Extrapolation is fragile.** Push the pose or expression beyond what was
captured and the Gaussians stretch into thin needles or tear apart. Explicit
primitives don't regularize as gracefully as a smooth surface.

**One person, one model.** Most methods train per identity from a multi-view
capture or a long video. Building a good avatar from a single photo usually
means borrowing priors from a big generative model, which brings its own
trade-offs.

**Size adds up.** With degree-3 spherical harmonics, each Gaussian carries 59
floats: 3 for position, 3 for scale, 4 for rotation, 1 for opacity and 48 for
colour. Multiply by a few hundred thousand and you're looking at tens of
megabytes per avatar before any compression.

## So, should you throw away your meshes?

No, and that's the funny part. The winning recipe today is a hybrid: a classic
parametric mesh as the skeleton, a cloud of Gaussians as the skin, and a small
network to fill in the gaps. The old graphics ideas provide the structure; the
new ones provide the realism.

It's a nice reminder that progress in this field is rarely a clean replacement.
More often, it's the old ideas getting a new coat of fuzzy blobs.

## References

- Kerbl, Kopanas, Leimkühler, Drettakis. [3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/). SIGGRAPH 2023.
- Mildenhall et al. [NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis](https://www.matthewtancik.com/nerf). ECCV 2020.
- Zwicker, Pfister, van Baar, Gross. EWA Volume Splatting. IEEE Visualization 2001.
- Qian et al. [GaussianAvatars: Photorealistic Head Avatars with Rigged 3D Gaussians](https://shenhanqian.github.io/gaussian-avatars). CVPR 2024.
- Loper et al. [SMPL: A Skinned Multi-Person Linear Model](https://smpl.is.tue.mpg.de/). SIGGRAPH Asia 2015.
- Li et al. [Learning a model of facial shape and expression from 4D scans (FLAME)](https://flame.is.tue.mpg.de/). SIGGRAPH Asia 2017.
- Müller et al. Instant Neural Graphics Primitives with a Multiresolution Hash Encoding. SIGGRAPH 2022.
