import spacy
from typing import List, Dict
from app.schemas.api import PromptSegment

class NLPAnalyzer:
    """Analyze prompts using spaCy to extract meaningful linguistic segments."""

    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            # Fallback if model load fails during init
            self.nlp = None

    def analyze_prompt(self, prompt: str) -> List[PromptSegment]:
        """Categorize prompt parts into Object, Attribute, Style, and Environment."""
        if not self.nlp or not prompt.strip():
            return []

        doc = self.nlp(prompt)
        segments = []
        
        # 1. Extract Primary Objects (Noun Chunks)
        for i, chunk in enumerate(doc.noun_chunks):
            segments.append(
                PromptSegment(
                    id=f"obj-{i}",
                    label="Object",
                    text=chunk.text,
                    kind="object",
                    impact=0.85 if i == 0 else 0.75,
                    effect=f"The primary subject '{chunk.text}' sets the main direction for the result."
                )
            )

        # 2. Extract Attributes (Adjectives)
        adj_index = 0
        for token in doc:
            if token.pos_ == "ADJ" and token.dep_ != "punct":
                # Check if it's already part of a noun chunk to avoid redundancy, 
                # but often we want them separate for specific control.
                segments.append(
                    PromptSegment(
                        id=f"attr-{adj_index}",
                        label="Attribute",
                        text=token.text,
                        kind="attribute",
                        impact=0.65,
                        effect=f"The descriptor '{token.text}' tunes the visual and tonal precision."
                    )
                )
                adj_index += 1

        # 3. Extract Style/Medium (Heuristic-based)
        style_keywords = ["painting", "photograph", "digital art", "sketch", "masterpiece", "isometric", "cinematic"]
        for i, token in enumerate(doc):
            if token.text.lower() in style_keywords or (token.dep_ == "prep" and token.text.lower() == "in"):
                # Capturing prepositional style phrases like "in the style of..."
                text = token.text
                if token.head.text.lower() in ["style", "aesthetic"]:
                   text = f"{token.text} {token.head.text}"
                
                segments.append(
                    PromptSegment(
                        id=f"style-{i}",
                        label="Style",
                        text=text,
                        kind="style",
                        impact=0.80,
                        effect="This segment defines the overarching aesthetic and medium of the output."
                    )
                )

        # 4. Extract Environment (Prepositions/Locations)
        for i, token in enumerate(doc):
            if token.pos_ == "ADP" and token.text.lower() in ["in", "at", "on", "near", "above", "below"]:
                # Often environment starts with a preposition
                env_text = "".join([t.text + t.whitespace_ for t in token.subtree]).strip()
                if len(env_text.split()) > 1:
                    segments.append(
                        PromptSegment(
                            id=f"env-{i}",
                            label="Environment",
                            text=env_text,
                            kind="environment",
                            impact=0.70,
                            effect="This context grounds the subject within a specific spatial or situational frame."
                        )
                    )

        # De-duplicate and limit to the most relevant segments
        seen_text = set()
        unique_segments = []
        for s in segments:
            if s.text.lower() not in seen_text:
                unique_segments.append(s)
                seen_text.add(s.text.lower())

        return unique_segments[:6]  # Limit to top 6 for UI clarity
