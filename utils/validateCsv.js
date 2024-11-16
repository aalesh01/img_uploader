export const validateCsv = (products) => {
  const errors = [];

  const rows = products.trim().split("\n");

  const headers = rows[0].split(",");
  if (
    headers.length !== 3 ||
    headers[0] !== "Serial Number" ||
    headers[1] !== "Product Name" ||
    headers[2] !== "Input Image Urls"
  ) {
    errors.push("Invalid CSV header");
  }

  for (let i = 1; i < rows.length; i++) {
    const columns = rows[i].split(",");

    if (columns.length !== 3) {
      errors.push(`Row ${i + 1}: Incorrect number of columns`);
      continue;
    }

    const serialNumber = parseInt(columns[0].trim(), 10);
    if (isNaN(serialNumber) || serialNumber <= 0) {
      errors.push(`Row ${i + 1}: Invalid Serial Number`);
    }

    const productName = columns[1].trim();
    if (!productName) {
      errors.push(`Row ${i + 1}: Product Name is required`);
    }

    const imageUrl = columns[2].trim();
    try {
      new URL(imageUrl);
    } catch (e) {
      errors.push(`Row ${i + 1}: Invalid Image URL`);
    }
  }

  return errors;
}

export const validationErrors = validateCsv(products);

if (validationErrors.length > 0) {
  console.log("Errors found:", validationErrors);
} else {
  console.log("CSV is valid");
}
