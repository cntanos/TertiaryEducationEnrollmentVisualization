import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.offsetbox import OffsetImage, AnnotationBbox
import os

# Data
countries = ['Iceland', 'Sweden', 'Bosnia and Herzegovina', 'Poland', 'Albania', 'Estonia', 'Cyprus', 'Slovakia', 
             'Norway', 'Lithuania', 'Malta', 'North Macedonia', 'Serbia', 'Latvia', 'Slovenia', 'Croatia', 
             'Denmark', 'Czechia', 'Belgium', 'Italy', 'Romania', 'France', 'Bulgaria', 'European Union - 27', 
             'Finland', 'Austria', 'Hungary', 'Spain', 'Ireland', 'Portugal', 'Luxembourg', 'Switzerland', 
             'Germany', 'Türkiye', 'Greece', 'Liechtenstein']
males = [34.0, 39.4, 39.8, 40.3, 40.7, 40.8, 40.9, 41.2, 41.4, 41.6, 41.9, 42.0, 42.0, 42.2, 42.3, 42.4, 
         42.8, 42.9, 43.6, 43.8, 44.5, 44.6, 44.6, 45.4, 45.4, 45.4, 45.4, 45.6, 45.6, 46.4, 46.5, 48.7, 
         50.0, 50.3, 50.4, 59.9]
females = [66.0, 60.6, 60.2, 59.7, 59.3, 59.2, 59.1, 58.8, 58.6, 58.4, 58.1, 58.0, 58.0, 57.8, 57.7, 57.6, 
           57.2, 57.1, 56.4, 56.2, 55.5, 55.4, 55.4, 54.6, 54.6, 54.6, 54.6, 54.4, 54.4, 53.6, 53.5, 51.3, 
           50.0, 49.7, 49.6, 40.1]

# Create a DataFrame
data = pd.DataFrame({
    'Country': countries,
    'Male Enrollment (%)': males,
    'Female Enrollment (%)': females
})

# Map country names to their two-letter codes
country_codes = {
    'Austria': 'at', 'Belgium': 'be', 'Bulgaria': 'bg', 'Croatia': 'hr', 'Cyprus': 'cy',
    'Czechia': 'cz', 'Denmark': 'dk', 'Estonia': 'ee', 'Finland': 'fi', 'France': 'fr',
    'Germany': 'de', 'Greece': 'gr', 'Hungary': 'hu', 'Ireland': 'ie', 'Italy': 'it',
    'Latvia': 'lv', 'Lithuania': 'lt', 'Luxembourg': 'lu', 'Malta': 'mt', 'Netherlands': 'nl',
    'Poland': 'pl', 'Portugal': 'pt', 'Romania': 'ro', 'Slovakia': 'sk', 'Slovenia': 'si',
    'Spain': 'es', 'Sweden': 'se', 'Norway': 'no', 'Switzerland': 'ch', 'Iceland': 'is',
    'Liechtenstein': 'li', 'Bosnia and Herzegovina': 'ba', 'Albania': 'al', 'Serbia': 'rs',
    'North Macedonia': 'mk', 'Türkiye': 'tr', 'European Union - 27': 'eu'
}

# Add the country codes to the DataFrame
data['Country Code'] = data['Country'].map(country_codes)

# Sort the data by Female Enrollment ascending
data_sorted = data.sort_values('Female Enrollment (%)', ascending=True).reset_index(drop=True)

# Set up the figure and axis
fig, ax = plt.subplots(figsize=(12, 18))

# Define color palette
male_color = '#1F77B4'    # Blue
female_color = '#FF7F0E'  # Orange

# Plot the stacked bar chart
bar_male = ax.barh(data_sorted.index, data_sorted['Male Enrollment (%)'], color=male_color, edgecolor='white', label='Males')
bar_female = ax.barh(data_sorted.index, data_sorted['Female Enrollment (%)'], left=data_sorted['Male Enrollment (%)'], color=female_color, edgecolor='white', label='Females')

# Adjust x-axis limits to include space for flags and country names
ax.set_xlim(-15, 100)

# Remove default y-tick labels since we are adding custom labels
ax.set_yticks([])

# Function to resize flags dynamically
def add_flag_and_name(idx, country_code, country_name, flag_size=0.15):
    """Add flags to the right of country names with a larger size."""
    if pd.notna(country_code):
        flag_path = f'flags/{country_code.lower()}.png'
        if os.path.exists(flag_path):
            flag_img = plt.imread(flag_path)
            imagebox = OffsetImage(flag_img, zoom=flag_size)
            ab = AnnotationBbox(imagebox, (1.05, idx), frameon=False, box_alignment=(0, 0.5))  # Positioning flags on the right
            ax.add_artist(ab)
    # Add country name to the left of the flag
    ax.text(-1, idx, country_name, va='center', ha='right', fontsize=12)

# Incorporate country flags and country names next to labels
for idx, row in data_sorted.iterrows():
    add_flag_and_name(idx, row['Country Code'], row['Country'])

# Set x-axis labels and title
ax.set_xlabel('Enrollment Percentage (%)', fontsize=14, labelpad=15)
ax.set_title('Tertiary Education Enrollment by Sex\nin EU 27 and Other Countries', fontsize=18, pad=20, weight='bold')

# Add data labels inside the bars
for bar_m, bar_f, male_perc, female_perc in zip(bar_male, bar_female, data_sorted['Male Enrollment (%)'], data_sorted['Female Enrollment (%)']):
    bar_center = bar_m.get_y() + bar_m.get_height() / 2

    # Male percentage label
    if male_perc > 5:
        ax.text(bar_m.get_width() / 2, bar_center, f"{male_perc:.1f}%", ha='center', va='center', color='white', fontsize=10, weight='bold')
    else:
        ax.text(bar_m.get_width() + 1, bar_center, f"{male_perc:.1f}%", ha='left', va='center', color='black', fontsize=10)

    # Female percentage label
    if female_perc > 5:
        ax.text(bar_m.get_width() + bar_f.get_width() / 2, bar_center, f"{female_perc:.1f}%", ha='center', va='center', color='white', fontsize=10, weight='bold')
    else:
        ax.text(bar_m.get_width() + bar_f.get_width() + 1, bar_center, f"{female_perc:.1f}%", ha='left', va='center', color='black', fontsize=10)

# Remove spines for a cleaner look
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_visible(False)
ax.spines['bottom'].set_visible(False)

# Set x-ticks and grid lines every 10%
xticks = np.arange(0, 101, 10)
ax.set_xticks(xticks)
ax.xaxis.set_tick_params(top=True, labeltop=True, bottom=True, labelbottom=True)

# Add grid lines
ax.xaxis.grid(True, which='major', linestyle='--', linewidth=0.5, color='gray', alpha=0.7)
ax.set_axisbelow(True)

# Highlight the 50% line with a dotted line
ax.axvline(x=50, color='black', linestyle=':', linewidth=2, alpha=0.8)


# Add watermark text using figure.text
fig.text(0.5, 0.01, "Source: Eurostat | Data: 2022 | https://ec.europa.eu/eurostat/databrowser/view/educ_uoe_enrt03__custom_13017565/default/table",
         fontsize=10, color='gray', ha='center')

# Add Eurostat logo at the bottom-left corner of the figure
eurostat_logo_path = 'flags/eurostat.png'  # Path to the Eurostat logo
if os.path.exists(eurostat_logo_path):
    eurostat_logo_img = plt.imread(eurostat_logo_path)
    imagebox_logo = OffsetImage(eurostat_logo_img, zoom=0.15)  # Adjust the zoom factor for the logo size
    logo_box = AnnotationBbox(imagebox_logo, (0.04, 0.01), frameon=False, xycoords='figure fraction')  # Position logo near bottom-left
    ax.add_artist(logo_box)

# Adjust layout to reduce space at the bottom
plt.subplots_adjust(bottom=0.06)  # Reduced bottom space to close the gap

# Add legend
legend = ax.legend(loc='lower right', frameon=False, fontsize=12)

# Save the figure with high resolution
plt.savefig('tertiary_education_enrollment_infographic.png', dpi=300, bbox_inches='tight')

# Show the plot
plt.show()
