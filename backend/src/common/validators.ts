export const validateProductData = (
  title: string,
  description: string,
  price: number,
  count: number
) => {
  const errors = [];

  if (!title || typeof title !== "string" || title.trim() === "") {
    errors.push("title is required and must be a non-empty string");
  }

  if (
    !description ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    errors.push("description is required and must be a non-empty string");
  }

  if (typeof price !== "number" || price <= 0) {
    errors.push("price must be a number greater than 0");
  }

  if (typeof count !== "number" || count < 0) {
    errors.push("count must be a number >= 0");
  }

  return errors.length > 0 ? errors : null;
};
