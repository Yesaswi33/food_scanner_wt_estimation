def get_color_for_class(class_name):
    """Get consistent color for a class name"""
    global color_map
    if class_name not in color_map:
        # Generate a random color and store it
        color_map[class_name] = (
            np.random.randint(150, 256),
            np.random.randint(175, 256),
            np.random.randint(100, 256),
        )
    return color_map[class_name]
