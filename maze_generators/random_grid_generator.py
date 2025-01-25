import random


def generate_random_grid(width, height):
    """
    Generates a 2D array filled with 0 and 1 values.

    :param rows: Number of rows in the array.
    :param cols: Number of columns in the array.
    :return: A 2D list (rows x cols) filled with 0 and 1 values.
    """
    labyrinth_array_width, labyrinth_array_height = 2 * width + 1, 2 * height + 1
    return [
        [random.choice([0, 1]) for _ in range(labyrinth_array_width)]
        for _ in range(labyrinth_array_height)
    ]
