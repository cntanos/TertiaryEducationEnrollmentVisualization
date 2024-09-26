import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import os
from matplotlib.offsetbox import OffsetImage, AnnotationBbox

# Dummy data
data = {
    'Country': ['Country1', 'Country2', 'Country3'],
    'Country Code': ['us', 'ca', 'mx'],
    'Male Enrollment (%)': [40, 50, 60],
    'Female Enrollment (%)': [60, 50, 40]
}
data_sorted = pd.DataFrame(data)

# Colors
male_color = 'blue'
female_color = 'pink'

# Create a figure and axis
fig, ax = plt.subplots(figsize=(10, 6))

# Plot the stacked bar chart
bar_male = ax.barh(data_sorted.index, data_sorted['Male Enrollment (%)'], color=male_color, edgecolor='white', label='Males')
bar_female = ax.barh(data_sorted.index, data_sorted['Female Enrollment (%)'], left=data_sorted['Male Enrollment (%)'], color=female_color, edgecolor='white', label='Females')

# Incorporate country flags next to labels
for idx, row in data_sorted.iterrows():
    country_code = row['Country Code']
    country_name = row['Country']
    if pd.notna(country_code):
        flag_path = f'flags/{country_code.lower()}.png'
        if os.path.exists(flag_path):
            print(f"Loading flag for {country_name} from {flag_path}")
            flag_img = plt.imread(flag_path)
            imagebox = OffsetImage(flag_img, zoom=0.1)  # Adjust zoom if necessary
            ab = AnnotationBbox(imagebox, (-15, idx), frameon=False, box_alignment=(1, 0.5))  # Move flag further left
            ax.add_artist(ab)
        else:
            print(f"Flag not found for {country_name} at {flag_path}")
    else:
        print(f"No country code for {country_name}")
    # Add country name next to the flag
    ax.text(-8, idx, country_name, va='center', ha='right', fontsize=12)  # Move text closer to the bars

# Set labels and title
ax.set_yticks(data_sorted.index)
ax.set_yticklabels(data_sorted['Country'])
ax.set_xlabel('Enrollment (%)')
ax.set_title('Enrollment by Country and Gender')

# Adjust plot limits to ensure flags are visible
ax.set_xlim(-20, 100)  # Adjust the x-axis limits as necessary

# Display the plot
plt.show()