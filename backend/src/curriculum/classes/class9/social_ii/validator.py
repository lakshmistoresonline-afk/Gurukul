from typing import Dict, Any
class Class9SocialIIValidator:
    @classmethod
    def validate(cls, data: Dict[str, Any]) -> bool: return isinstance(data, (dict, list))
