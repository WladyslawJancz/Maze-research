def prefix_id(prefix: str, id: str) -> str:
    """_summary_

    Args:
        prefix (str): ID prefix
        id (str): Main part of ID

    Returns:
        str: full ID in format "{prefix}-{id}"
    """
    return "-".join([prefix, id])
