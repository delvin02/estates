hpi_dict = {
    2019: 0.85,
    2020: 0.88,
    2021: 0.92,
    2022: 0.97,
    2023: 0.99,
    2024: 1.00
}

def get_hpi(year):
    if year < 2019:
        return hpi_dict[2019]
    elif year > 2024:
        return hpi_dict[2024]
    else:
        return hpi_dict[year]
    