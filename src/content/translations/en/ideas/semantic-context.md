---
title: Semantic units from token probabilities
description: Research hypothesis · representations, similarity and semantic drift.
---

I want to investigate whether a language model’s conditional token probabilities can be aggregated into representations of text segments. The aim would be to form semantic units and capture their proximity or change through vector distances.

For tracking context files, this could provide signals of semantic drift. Whether the representation captures meaning would need evaluation against suitable examples and established sentence embeddings. A similarity score alone does not establish whether information is current.

A reference for comparison: [Sentence-BERT](https://arxiv.org/abs/1908.10084).
