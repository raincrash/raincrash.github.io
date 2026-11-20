---
title: "Hearing the Shape of A Drum"
description: Spectral geometry, the Laplace–Beltrami operator, and whether the eigenvalues of a manifold determine its shape.
tags: [geometry, ml]
---

Spectral geometry may sound like an abstract concept reserved for mathematicians, but its potential applications in various fields make it a fascinating topic for scientists and technology experts alike. At its core, spectral geometry explores the relationship between a manifold's geometry and its spectrum - an idea that has found relevance in classical and quantum mechanics, analysis, and even the study of the universe itself. As a computer scientist, I became particularly intrigued by how these concepts could be extended to shape analysis applications, such as correspondence matching, style transfer, and interpolation. To dive deeper into this intriguing field, let's first explore the basic concepts of a Riemannian manifold and the Laplace-Beltrami operator.

## First, the Riemannian manifold

Flat earthers are right. The surface of the earth is a 2D manifold. Zoom in far enough on any region of it and it looks like a piece of the flat Euclidean plane.

![Polar stereographic projections of the Earth. By User:RokerHRO - Combination of Stereographic Projection Water Hemisphere and Stereographic Projection Polar Extreme into a single image, CC BY-SA 3.0, Link](https://upload.wikimedia.org/wikipedia/commons/f/f0/Polar_stereographic_projections.jpg)


A manifold is defined as a topological space that locally resembles Euclidean space near each point. This notion allows complicated systems to be explained in simpler terms of local topological properties of Euclidean space.

In computer vision, the notion a manifold is used quite frequently – in rotation averaging (the rotation group \\( SO(3) \\)), structure and motion (“Essential” manifold), to capture the shape of an object (“Shape” manifolds), to model a set of images (“Grassmann” manifolds) or to simply represent a sphere \\( S^n \\).

![The space of essential matrices as a Riemannian manifold, C: Roberto Tron](<http://sites.bu.edu/tron/files/2016/08/essentialManifold.png>)


A “Hilbert” space is an abstract vector space with an inner product that is complete with respect to the distance it induces: every Cauchy sequence converges, which is what allows calculus to be used. This generalises the notion of Euclidean space by extending the methods of vector algebra and calculus from 2D Euclidean plane and 3D spaces to higher dimensions.

Thus, we can define norms in Hilbert space to allow us to measure distances, and inner products to allow us to measure angles.

On a Riemannian manifold, you get to measure lengths of the curves. A Riemannian manifold is a manifold with an inner product defined in the tangent space at each point. Riemannian geometry is a field by itself.

A Riemannian metric (tensor) makes it possible to define several geometric notions on a Riemannian manifold, such as angle at an intersection, length of a curve, area of a surface and higher-dimensional analogues (volume, etc.), extrinsic curvature of submanifolds, and intrinsic curvature of the manifold itself. It also allows us to define “geodesic distance” on the manifold.

### Geodesics

Geodesics are locally shortest curves. They preserve a direction on a surface and have many interesting properties. In a plane, the geodesics are straight lines. On a sphere, the geodesics are great circles (like the equator). The geodesics in a space depend on the Riemannian metric, which affects the notions of distance and acceleration. Again, metric geometry is a field by itself.

Equivalently in other areas, it can be defined as a path that a particle which is not accelerating would follow.

In Riemannian geometry, geodesics are locally distance-minimizing paths, but not necessarily globally: go the long way round a great circle and you're on a geodesic that is not the shortest route.

![A geodesic triangle on a sphere. By derivative work: Pbroks13 (talk) A geodesic triangle on the sphere. The geodesics are great circle arcs.](https://upload.wikimedia.org/wikipedia/commons/6/6a/Spherical_triangle.svg)


### Isometry and Isomorphism

Without going into too much details on metrics and (pseudo-) Riemannian manifolds, an isometry of a manifold can be defined in simpler terms as any (smooth) mapping of that manifold (into itself, or into another manifold) that preserves the notion of distance between points.

When such a mapping is on smooth manifolds (and is a diffeomorphism: a smooth bijection whose inverse is also smooth), it is called isometry, and provides a notion of isomorphism (“sameness”).

### Notations

(Notation follows Marc Lackenby's notes, linked below.)

Terminology: Let \\( M \\) be a smooth manifold. Denote the tangent space at \\( x \in M \\) by \\(  T_x{M} \\).

If $$ f: M \rightarrow N $$ is a smooth map between smooth manifolds, denote the associated map on $$ T_x{M} $$ by $$ (Df)_x : T_x{M} \rightarrow T_{f(x)}N $$. If $$ I $$ is an open interval in $$ \mathbb{R} $$ and $$ \alpha : I \rightarrow M $$ is a smooth path, then for $$ t \in I $$, its velocity $$ \alpha'(t) $$ denotes $$ (D \alpha)_t (1) \in T_{\alpha(t)}M $$.

Definition: A Riemannian metric on a smooth manifold \\( M \\) is a choice at each point \\( x \in M \\) of a positive definite inner product \\( \langle \cdot, \cdot \rangle \\) on \\( T_xM \\), the inner products varying smoothly with \\( x \\). Then \\( M \\) is known as a Riemannian manifold.

A local isometry between two Riemannian manifolds \\( M \\) and \\( N \\) is a local diffeomorphism \\( h : M \rightarrow N \\), such that, for all points \\( x \in M \\) and all vectors \\( v \\) and \\( w \\) in \\( T_xM \\):

$$
\langle v, w \rangle = \langle (Dh)_x(v), (Dh)_x(w) \rangle
$$

A (Riemannian) isometry is a local isometry that is also a diffeomorphism.

Now, that we have a basic idea about the Riemannian manifolds, let’s have a very quick look at the Laplace-Beltrami operator.

### Next, the Laplacian…

The Laplace operator is a fundamental concept in calculus, given by the divergence of the gradient of a function on Euclidean space. The Laplacian of a function  \\( f \\) at point \\( p \\) is the rate at which the average value of  \\( f \\) over spheres centered at
 \\( p \\) deviates from  \\( f(p) \\) as the radius of the sphere shrinks towards 0.

First applied in the study of celestial mechanics, solutions of the equation
\\( \Delta f = 0 \\), now called Laplace’s equation, are the so-called harmonic functions and represent the possible gravitational fields in regions of vacuum.

### Laplace-Beltrami operator

The Laplacian generalizes to a Riemannian manifold \\( (M,g) \\) as the Laplace-Beltrami operator \\( \Delta_g \\).

Equivalently other areas (esp. in diffusion processes) utilize this idea - fluid mechanics (the Navier-Stokes equation), potential theory (Poisson equation), heat diffusion (heat equation), wave equation, quantum physics (Schrödinger equation) and so on.

### Now, what is Spectral Geometry?

Spectral geometry is a field in mathematics which concerns relationships between geometric structures of manifolds and spectra of canonically defined differential operators.

Given a closed (compact, without boundary) and connected Riemannian manifold, we can associate to it the (linear unbounded) Laplace-Beltrami operator. This operator is self-adjoint and its spectrum is discrete: namely, the spectrum consists of an increasing sequence of non-negative real eigenvalues \\( 0 = \lambda_0 < \lambda_1 \le \lambda_2 \le \dots \to \infty \\), each with finite multiplicity.

Two closed Riemannian manifolds are said to be isospectral if the eigenvalues of their Laplace–Beltrami operator (Laplacians), counted with multiplicities, coincide.

Thus, spectral geometry is the connection between the spectrum  \\( Spec(M,g) \\)
 and the geometry of the manifold  \\( (M,g) \\) . This fundamentally deals with two kinds of problems:

### Direct Problems

A problem that arises a lot in physics, the analysis of PDEs, probability etc. is to compute the spectrum of Laplacian (or other operators). A typical goal is to find bounds on the eigenvalues of a Riemannian manifold. In other words:

> compute (exactly or not) the spectrum \\( Spec(M,g) \\)? And (or) find properties on the spectrum  \\( Spec(M,g) \\)

Direct problems attempt to infer the behavior of the eigenvalues of a Riemannian manifold from knowledge of the geometry.

### Inverse Problems

The problem we’ll look more into detail in the next post, is the inverse problem. One of fundamental problems in spectral geometry is to ask to what extent the eigenvalues determine the geometry of a given manifold.

One direction is easy: the spectrum is a Riemannian invariant, so if two Riemannian manifolds \\( (M,g) \\) and \\( (M',g') \\) are isometric, then they are isospectral, i.e. \\( Spec(M,g) = Spec(M',g') \\). The interesting question is the converse:

> which geometric information of the manifold can we determine from the spectrum? does the data of the spectrum  \\( Spec(M,g) \\) determine the “shape” of the manifold  \\( (M,g) \\)?

### Hearing the shape of a drum

This question of isospectrality in Riemannian geometry may be traced back to H. Weyl in 1911–1912 and became popularized thanks to M. Kac’s article of 1966. The famous sentence of Kac “Can one hear the shape of a drum?” refers to this type of isospectral problem.

Spoiler: the answer is [no](https://en.wikipedia.org/wiki/Hearing_the_shape_of_a_drum#The_answer). There exist isospectral manifolds that are not isometric. Milnor found a pair of 16-dimensional tori in 1964, and in 1992 Gordon, Webb and Wolpert constructed two differently shaped planar “drums” that sound exactly the same.

### Isospectralization

A formulation of this inverse problem in terms of computer vision and shape analysis, is isospectralization, a numerical optimisation procedure in relation with interpolation, correspondence matching and style transfer. More details of this can be found in my presentation for "Recent Advances in the Analysis of 3D Shapes" seminar at TU Munich.

<iframe class="speakerdeck-iframe" frameborder="0" src="https://speakerdeck.com/player/bb785583287644c2803276db84c7d64e" title="Isospectralization" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" style="border: 0px; background: padding-box padding-box rgba(0, 0, 0, 0.1); margin: 0px; padding: 0px; border-radius: 6px; box-shadow: rgba(0, 0, 0, 0.2) 0px 5px 40px; width: 560px; height: 420px;" data-ratio="1.3333333333333333"></iframe>

### Source Code and Demo

Check out my isospectralization PyTorch implementation [notebooks](https://github.com/raincrash/shapeanalysis-seminar).

## References

- Yaiza Canzani. Notes for Analysis on Manifolds via the Laplacian.
- M. Craioveanu, M. Puta and T. Rassias. Old and New Aspects in Spectral Geometry. Kluwer, 2001.
- Olivier Lablée. [Spectral Theory in Riemannian Geometry](https://doi.org/10.4171/151). EMS, 2015.
- <https://en.wikipedia.org/wiki/Laplace_operator>
- Marc Lackenby. [Introduction to Riemannian manifolds](https://people.maths.ox.ac.uk/lackenby/intriem.pdf) (lecture notes, Oxford).
- <https://sites.google.com/site/olivierlablee/spectral-geometry>
- <https://en.wikipedia.org/wiki/Hearing_the_shape_of_a_drum>