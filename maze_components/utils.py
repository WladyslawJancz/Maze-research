def create_id(prefix: str, element_id: str) -> str:
    """_summary_

    Args:
        prefix (str): ID prefix
        element_id (str): Main part of ID

    Returns:
        str: full ID in format "{prefix}-{element_id}"
    """
    return "-".join([prefix, element_id])
