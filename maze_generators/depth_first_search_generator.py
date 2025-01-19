import time
import random
import numpy as np


def generate_dfs_labyrinth(width, height=None):
    """Generates a square maze using randomized depth-first search algorithm in iterative implementation"""
    # random.seed(43)

    def get_unvisited_cell_neighbors(current_cell_coordinates: list):
        nonlocal neighbor_search_time
        start_time = time.time()  # Start timing neighbor search

        y, x = current_cell_coordinates
        unvisited_neighbors = []

        # Create a mask for valid indices in the array (no out-of-bound indices)
        rows, cols = labyrinth_array.shape

        # Check two positions away in the row (y-axis)
        row_mask_up = y - 2 >= 0  # Valid index for y-2
        row_mask_down = y + 2 < rows  # Valid index for y+2

        # Check two positions away in the column (x-axis)
        col_mask_left = x - 2 >= 0  # Valid index for x-2
        col_mask_right = x + 2 < cols  # Valid index for x+2

        # Using .where() to find valid positions along y-axis and x-axis
        if row_mask_up:
            if labyrinth_array[y - 2, x] == 1:
                unvisited_neighbors.append([y - 2, x])
        if row_mask_down:
            if labyrinth_array[y + 2, x] == 1:
                unvisited_neighbors.append([y + 2, x])

        if col_mask_left:
            if labyrinth_array[y, x - 2] == 1:
                unvisited_neighbors.append([y, x - 2])
        if col_mask_right:
            if labyrinth_array[y, x + 2] == 1:
                unvisited_neighbors.append([y, x + 2])

        neighbor_search_time += (
            time.time() - start_time
        )  # Accumulate neighbor search time
        return unvisited_neighbors

    def remove_wall_between_neighbors(
        current_cell_coordinates: list, next_cell_coordinates: list
    ):
        """Checks if cells at provided coordinates are neighbors, removes wall between them in maze array if true"""
        nonlocal wall_removal_time
        start_time = time.time()  # Start timing wall removal

        cy, cx = current_cell_coordinates
        ny, nx = next_cell_coordinates

        # Check if the cells are exactly 2 units apart along one axis
        if (cy == ny and abs(cx - nx) == 2) or (cx == nx and abs(cy - ny) == 2):
            # Calculate the wall coordinates as the midpoint between the two cells
            wall_y = (cy + ny) // 2
            wall_x = (cx + nx) // 2

            # Remove the wall
            labyrinth_array[wall_y, wall_x] = 0

        wall_removal_time += time.time() - start_time  # Accumulate wall removal time

    # Initialize timing variables
    if height == None:
        height = width
    print(f"\nCreating a {width} by {height} maze")
    neighbor_search_time = 0
    wall_removal_time = 0
    total_time = time.time()

    # set array size for the algorithm to work and fill it with ones (unvisited paths, walls not broken).
    # (2*x + 1) formula provides size of an array that includes all internal and external walls
    labyrinth_array_width, labyrinth_array_height = 2 * width + 1, 2 * height + 1
    labyrinth_array = np.ones((labyrinth_array_height, labyrinth_array_width))

    # initialize stack
    stack = []

    # pick a random starting cell, mark it as visited (set value to 0), and push it to the stack
    y, x = random.choice(range(1, labyrinth_array_height - 1, 2)), random.choice(
        range(1, labyrinth_array_width - 1, 2)
    )
    labyrinth_array[y, x] = 0
    stack.append([y, x])

    while stack:  # ...is not empty
        # current_cell = stack[-1]
        current_cell = (
            stack.pop()
        )  # pop the last element from stack, make it a current cell
        current_cell_unvisited_neighbors = get_unvisited_cell_neighbors(current_cell)
        if current_cell_unvisited_neighbors:  # ...list is not empty
            stack.append(current_cell)  # assign current cell back to stack
            next_cell = random.choice(
                current_cell_unvisited_neighbors
            )  # choose next cell randomly

            # remove the wall between current and next cell, mark next cell as visited and add it to the stack
            remove_wall_between_neighbors(current_cell, next_cell)
            labyrinth_array[tuple(next_cell)] = 0
            stack.append(next_cell)
        # else:
        #     stack.pop()

    labyrinth_array[-1][random.choice(range(1, labyrinth_array_width - 1, 2))] = 0
    labyrinth_array[0][random.choice(range(1, labyrinth_array_width - 1, 2))] = 0
    print(labyrinth_array[0])
    total_time = time.time() - total_time

    print(f"Total Time: {total_time:.4f} seconds")
    print(f"Neighbor Search Time: {neighbor_search_time:.4f} seconds")
    print(f"Wall Removal Time: {wall_removal_time:.4f} seconds")

    return labyrinth_array.tolist()
