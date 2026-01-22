from pydantic import BaseConfig

class CustomConfig(BaseConfig):
    protected_namespaces = ()