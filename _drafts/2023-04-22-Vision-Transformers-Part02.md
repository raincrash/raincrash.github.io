---
layout: post
title: "Vision Transformers - Part 2: Image Classification"
categories: ml
---

Now, we'll implement a simple Vision Transformer (ViT) in PyTorch and compare it with a CNN-based network for an image classification task.

To keep things easy, let's begin with a boilerplate code in [Pytorch Lightning](https://lightning.ai/) to train a neural network.


```python
# main.py
# ! pip install torchvision
import torch, torch.nn as nn, torch.utils.data as data, torchvision as tv, torch.nn.functional as F
import lightning as L

# --------------------------------
# Step 1: Define a LightningModule
# --------------------------------
# A LightningModule (nn.Module subclass) defines a full *system*
# (ie: an LLM, diffusion model, autoencoder, or simple image classifier).


class LitAutoEncoder(L.LightningModule):
    def __init__(self):
        super().__init__()
        self.encoder = nn.Sequential(nn.Linear(28 * 28, 128), nn.ReLU(), nn.Linear(128, 3))
        self.decoder = nn.Sequential(nn.Linear(3, 128), nn.ReLU(), nn.Linear(128, 28 * 28))

    def forward(self, x):
        # in lightning, forward defines the prediction/inference actions
        embedding = self.encoder(x)
        return embedding

    def training_step(self, batch, batch_idx):
        # training_step defines the train loop. It is independent of forward
        x, y = batch
        x = x.view(x.size(0), -1)
        z = self.encoder(x)
        x_hat = self.decoder(z)
        loss = F.mse_loss(x_hat, x)
        self.log("train_loss", loss)
        return loss

    def configure_optimizers(self):
        optimizer = torch.optim.Adam(self.parameters(), lr=1e-3)
        return optimizer


# -------------------
# Step 2: Define data
# -------------------
dataset = tv.datasets.MNIST(".", download=True, transform=tv.transforms.ToTensor())
train, val = data.random_split(dataset, [55000, 5000])

# -------------------
# Step 3: Train
# -------------------
autoencoder = LitAutoEncoder()
trainer = L.Trainer()
trainer.fit(autoencoder, data.DataLoader(train), data.DataLoader(val))
```

### CNN based network

For comparision, let's create a CNN based classifier to classify images on CIFAR10 dataset.

In the following code, we load a pre-trained ResNet18 model from `torchvision.models` and freeze all its parameters by setting `requires_grad` to `False`. We then replace the fully connected layer of the model with a new one with 10 output neurons to predict the 10 classes of CIFAR10. This way, we use the pre-trained ResNet18 as a feature extractor and train only the new fully connected layer on the CIFAR10 dataset. The `LitResNetPretrained` class defines the same training and validation loops and optimizer as before. The only difference is that the optimizer only updates the parameters of the new fully connected layer. The rest of the model remains frozen. By using transfer learning, we can achieve better performance with less training time and data.


``` python
# main.py
# !pip install torchvision
import torch
import torch.nn as nn
import torch.utils.data as data
import torchvision as tv
import pytorch_lightning as pl


# --------------------------------
# Step 1: Define a LightningModule
# --------------------------------
# A LightningModule (nn.Module subclass) defines a full *system*
# (ie: an LLM, diffusion model, autoencoder, or simple image classifier).


class LitResNetPretrained(pl.LightningModule):
    def __init__(self):
        super().__init__()
        self.resnet = tv.models.resnet18(pretrained=True)
        for param in self.resnet.parameters():
            param.requires_grad = False
        self.resnet.fc = nn.Linear(self.resnet.fc.in_features, 10)

    def forward(self, x):
        # in lightning, forward defines the prediction/inference actions
        x = self.resnet(x)
        return x

    def training_step(self, batch, batch_idx):
        # training_step defines the train loop. It is independent of forward
        x, y = batch
        y_hat = self(x)
        loss = nn.functional.cross_entropy(y_hat, y)
        self.log("train_loss", loss)
        return loss

    def validation_step(self, batch, batch_idx):
        # validation_step defines the val loop. It is independent of forward
        x, y = batch
        y_hat = self(x)
        loss = nn.functional.cross_entropy(y_hat, y)
        acc = (y_hat.argmax(dim=1) == y).float().mean()
        self.log("val_loss", loss)
        self.log("val_acc", acc)

    def configure_optimizers(self):
        optimizer = torch.optim.Adam(self.resnet.fc.parameters(), lr=1e-3)
        return optimizer


# -------------------
# Step 2: Define data
# -------------------
transform = tv.transforms.Compose([
    tv.transforms.Resize(256),
    tv.transforms.CenterCrop(224),
    tv.transforms.ToTensor(),
    tv.transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
trainset = tv.datasets.CIFAR10(".", train=True, transform=transform, download=True)
train, val = data.random_split(trainset, [45000, 5000])

# -------------------
# Step 3: Train
# -------------------
transfer_learning = LitResNetPretrained()
trainer = pl.Trainer(gpus=1 if torch.cuda.is_available() else 0, max_epochs=10)
trainer.fit(transfer_learning, data.DataLoader(train, batch_size=32), data.DataLoader(val, batch_size=32))

```

Let's add a step to test our model's accuracy.


```python
# -------------------
# Step 4: Test
# -------------------

# Load the saved model from disk
model = LitResNetPretrained.load_from_checkpoint("model_pretrained_resnet_cifar10.pt")

# Move the model to the desired device
model.to(device)

# Load the test set
test_dataset = tv.datasets.CIFAR10(".", download=True, transform=tv.transforms.ToTensor(), train=False)
test_loader = data.DataLoader(test_dataset, batch_size=32)

# Run inference on the test set
model.eval()
with torch.no_grad():
    correct = 0
    total = 0
    for images, labels in test_loader:
        images = images.to(device)
        labels = labels.to(device)
        outputs = model(images)
        _, predicted = torch.max(outputs.data, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

# Print the accuracy
print(f"Test accuracy: {100 * correct / total:.2f}%")
```