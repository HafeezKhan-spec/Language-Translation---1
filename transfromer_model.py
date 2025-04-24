from transformers import MBartForConditionalGeneration, MBartTokenizer
from datasets import load_dataset
from torch.utils.data import DataLoader
from torch.optim import AdamW
import torch
import os

class MBartFineTuner:
    def _init_(self):
        self.model_name = "facebook/mbart-large-50-many-to-many-mmt"
        self.model = MBartForConditionalGeneration.from_pretrained(self.model_name)
        self.tokenizer = MBartTokenizer.from_pretrained(self.model_name)
        
        self.src_lang = "en_XX"
        self.tgt_lang = "te_IN"
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        
    def prepare_data(self, dataset_path):
        # Load parallel corpus (English-Telugu dataset)
        dataset = load_dataset('csv', data_files=dataset_path)
        
        def preprocess_function(examples):
            inputs = [ex for ex in examples['english']]
            targets = [ex for ex in examples['telugu']]
            
            model_inputs = self.tokenizer(inputs, max_length=128, truncation=True, padding=True)
            with self.tokenizer.as_target_tokenizer():
                labels = self.tokenizer(targets, max_length=128, truncation=True, padding=True)
            
            model_inputs["labels"] = labels["input_ids"]
            return model_inputs
        
        tokenized_dataset = dataset.map(preprocess_function, batched=True)
        return tokenized_dataset
    
    def train(self, train_dataset, num_epochs=3, batch_size=8):
        train_dataloader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        
        optimizer = AdamW(self.model.parameters(), lr=5e-5)
        
        for epoch in range(num_epochs):
            self.model.train()
            total_loss = 0
            
            for batch in train_dataloader:
                batch = {k: v.to(self.device) for k, v in batch.items()}
                outputs = self.model(**batch)
                loss = outputs.loss
                total_loss += loss.item()
                
                loss.backward()
                optimizer.step()
                optimizer.zero_grad()
            
            avg_loss = total_loss / len(train_dataloader)
            print(f"Epoch {epoch+1}, Average Loss: {avg_loss:.4f}")
            
            # Save checkpoint
            checkpoint_path = f"checkpoint-epoch-{epoch+1}"
            self.model.save_pretrained(checkpoint_path)
            self.tokenizer.save_pretrained(checkpoint_path)
            
    def save_model(self, output_dir):
        self.model.save_pretrained(output_dir)
        self.tokenizer.save_pretrained(output_dir)

if _name_ == "_main_":
    # Initialize fine-tuner
    fine_tuner = MBartFineTuner()
    
    # Prepare dataset path
    dataset_path = "path/to/your/english_telugu_parallel_corpus.csv"
    
    # Prepare and load dataset
    tokenized_dataset = fine_tuner.prepare_data(dataset_path)
    
    # Fine-tune the model
    fine_tuner.train(tokenized_dataset["train"])
    
    # Save the fine-tuned model
    fine_tuner.save_model("fine_tuned_mbart")