---
layout: post
title: "How Attention Works in Vision Transformers - Part 1"
categories: ml
---

# How Attention Works in Vision Transformers - Part 1


In this blogpost, we'll explore how attention works in Vision Transformers and how it differs from traditional convolutional neural network (CNN) approaches.

Attention mechanisms have become a powerful tool in the world of deep learning. They allow models to selectively focus on important features and ignore irrelevant ones, resulting in more efficient and accurate predictions. The Transformer architecture, originally introduced in natural language processing (NLP) tasks, has recently been adapted for computer vision tasks as well, resulting in a new class of models called Vision Transformers (ViT).

## The Attention Mechanism

At its core, the attention mechanism allows a model to learn which parts of the input are most relevant for making predictions. This is achieved by computing a weight for each input element based on its relevance to the output. The weights are then used to compute a weighted sum of the input elements, which is passed through a neural network to produce the output.

In Vision Transformers, attention is computed between patches of the input image. These patches are flattened into a sequence of vectors, which are then processed by the Transformer architecture. The attention mechanism operates on pairs of vectors, calculating a weight for each pair based on their relevance to the output. This is done by computing a dot product between the vectors, which is then passed through a softmax function to obtain the weights.

## Multi-Head Attention

In order to improve the attention mechanism, Vision Transformers use a technique called multi-head attention. This involves computing several independent attention mechanisms in parallel, each with its own set of learned weights. The outputs of the different attention heads are concatenated and passed through a final linear layer to produce the final output.

Multi-head attention allows the model to focus on multiple aspects of the input simultaneously, which can be particularly useful in complex tasks such as object recognition or scene understanding.

At a high level, the attention mechanism in ViT allows the model to selectively focus on certain parts of an image when making predictions. This is achieved through a self-attention mechanism that learns to assign different weights to different parts of the input.

The ViT architecture starts with an image being split into patches, which are then flattened into a sequence of vectors. These vectors are then passed through a linear layer, followed by a positional encoding layer to inject spatial information into the input sequence.

Next, the self-attention mechanism is applied to the sequence. The input sequence is split into three vectors, the query, key, and value vectors. These vectors are then used to compute a weighted sum over the values, where the weights are determined by the similarity between the query and key vectors.

The similarity between the query and key vectors is computed using the dot product of the two vectors, which is then divided by the square root of the dimension of the key vector. This is followed by the application of a softmax function to normalize the weights.

The final output of the self-attention mechanism is the weighted sum of the value vectors. This operation allows the model to focus on certain parts of the image by assigning higher weights to relevant patches while ignoring irrelevant ones.

Finally, the output of the self-attention mechanism is passed through a feedforward neural network, which consists of two linear layers with a ReLU activation function in between. This network allows the model to learn non-linear relationships between the patches.

The output of the feedforward neural network is then passed to the next layer of the ViT, where the process is repeated. The final output of the model is produced by passing the output of the last layer through a linear layer.

The attention mechanism in ViT allows the model to selectively focus on relevant parts of an image, allowing it to achieve state-of-the-art performance on a variety of computer vision tasks. By leveraging self-attention, ViT avoids the need for handcrafted features, allowing it to learn meaningful representations directly from the raw image data.

## Positional Encoding

One limitation of using attention in computer vision tasks is that it does not take into account the spatial relationships between input elements. In order to overcome this, Vision Transformers use a technique called positional encoding. This involves adding a learnable encoding to each input element that encodes its position within the image.

The positional encoding is added to the input patch vectors before they are passed through the attention mechanism. This allows the model to take into account the spatial relationships between the patches when computing attention weights.

In Vision Transformers (ViT), the input images are first divided into small patches, which are then fed into a sequence of learnable embeddings. However, unlike natural language processing (NLP) tasks where the order of the tokens in a sentence is crucial, the order of the patches in an image is not necessarily important. Therefore, the ViT model requires a mechanism to encode the spatial information of the patches.

This is where positional encoding comes in. Positional encoding is a technique used to inject spatial information into the input sequence of the ViT model. It encodes the position of each patch in the input image, allowing the model to learn the spatial relationships between patches.

The positional encoding is added to the patch embeddings before feeding them to the transformer network. The position encoding vector is a fixed-length vector that contains information about the position of the patch in the input image.

There are different ways to encode the position of the patches. One common approach is to use a sinusoidal function with different frequencies and phases for each position. The idea behind using a sinusoidal function is that it is a smooth function that can represent periodic signals. By using different frequencies and phases for each position, the model can learn to differentiate between patches based on their position.

By adding the positional encoding to the patch embeddings, the ViT model is able to learn meaningful representations that take into account the spatial relationships between patches. This allows the model to achieve state-of-the-art performance on a variety of computer vision tasks without the need for handcrafted features.

To sum up, Vision Transformers have proven to be a powerful architecture for image analysis tasks by leveraging attention mechanism, which enables the model to capture complex relationships between image patches. Moreover, techniques such as multi-head attention and positional encoding have further improved their performance.

In the next post we will build a basic vision transformer (ViT) network in Pytorch.