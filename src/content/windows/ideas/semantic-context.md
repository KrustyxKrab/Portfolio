---
title: Semantische Einheiten aus Tokenwahrscheinlichkeiten
slug: semantic-context
parent: ideas
icon: folder
order: 1
description: Forschungshypothese · Repräsentationen, Ähnlichkeit und semantischer Drift.
---

Ich möchte untersuchen, ob sich aus den bedingten Tokenwahrscheinlichkeiten eines Sprachmodells Repräsentationen für Textabschnitte aggregieren lassen. Ziel wäre, semantische Einheiten zu bilden und ihre Nähe oder Veränderung über Vektordistanzen zu erfassen.

Für die Nachverfolgung von Kontextdateien könnte ein solcher Ansatz Hinweise auf semantischen Drift liefern. Ob die Repräsentation tatsächlich Bedeutung erfasst, müsste gegen geeignete Beispiele und etablierte Satz-Embeddings evaluiert werden. Ein Ähnlichkeitsscore allein bestimmt noch keine inhaltliche Aktualität.

Ein Vergleichspunkt: [Sentence-BERT](https://arxiv.org/abs/1908.10084).

<!-- Forschungsnotiz, keine validierte Methode. Konkretisieren: Modell/Kontext, berücksichtigte Verteilungen, Aggregation, Segmentierung, Normalisierung, Distanzmaß und Evaluation. -->
