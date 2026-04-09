"""
Custom model class for the desklib AI text detector.

The repo ships `model.safetensors` containing a DeBERTa-v3-large backbone plus
a single-logit classifier head. There's no modeling code in the repo, so we
recreate the architecture here verbatim from the README and call
`from_pretrained()` on THIS class (not `AutoModelForSequenceClassification`)
to load the weights.

Source: https://huggingface.co/desklib/ai-text-detector-v1.01
"""
import torch
import torch.nn as nn
from transformers import AutoConfig, AutoModel, PreTrainedModel


class DesklibAIDetectionModel(PreTrainedModel):
    config_class = AutoConfig
    # transformers >= 4.50 expects every PreTrainedModel subclass to declare
    # its tied-weight keys. We have no tied weights, so this stays empty.
    _tied_weights_keys: list[str] = []
    all_tied_weights_keys: dict = {}

    def __init__(self, config):
        super().__init__(config)
        self.model = AutoModel.from_config(config)
        self.classifier = nn.Linear(config.hidden_size, 1)
        self.init_weights()

    def forward(self, input_ids, attention_mask=None, labels=None):
        outputs = self.model(input_ids, attention_mask=attention_mask)
        last_hidden_state = outputs[0]

        # Mean pooling over non-padding tokens
        mask = attention_mask.unsqueeze(-1).expand(last_hidden_state.size()).float()
        summed = torch.sum(last_hidden_state * mask, dim=1)
        counts = torch.clamp(mask.sum(dim=1), min=1e-9)
        pooled = summed / counts

        logits = self.classifier(pooled)
        loss = None
        if labels is not None:
            loss_fct = nn.BCEWithLogitsLoss()
            loss = loss_fct(logits.view(-1), labels.float())

        out = {"logits": logits}
        if loss is not None:
            out["loss"] = loss
        return out
