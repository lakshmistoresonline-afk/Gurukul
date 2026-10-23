from typing import Dict, Any
class Class9MathsIIValidator:
    @classmethod
    def validate(cls, data: Dict[str, Any]) -> bool: return isinstance(data, (dict, list))
