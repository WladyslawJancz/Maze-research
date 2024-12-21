import random
def generate_random_grid(side_size):
    """
    Generates a 2D array filled with 0 and 1 values.

    :param rows: Number of rows in the array.
    :param cols: Number of columns in the array.
    :return: A 2D list (rows x cols) filled with 0 and 1 values.
    """
    side_size = 2*side_size + 1
    return [[random.choice([0, 1]) for _ in range(side_size)] for _ in range(side_size)]