const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";


// ==========================================
// GET PUBLIC COMPLAINTS
// ==========================================

export async function getPublicReports(filters = {}) {

  const params = new URLSearchParams();


  Object.entries(filters).forEach(
    ([key, value]) => {

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        params.append(key, value);
      }

    }
  );


  const query =
    params.toString();

  const url =
    `${API_URL}/api/reports/public` +
    (query ? `?${query}` : "");


  const response =
    await fetch(url);


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Unable to load public complaints."
    );

  }


  return data;

}


// ==========================================
// GET ONE PUBLIC COMPLAINT
// ==========================================

export async function getPublicReportById(
  reportId
) {

  const response =
    await fetch(
      `${API_URL}/api/reports/public/${reportId}`
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Unable to load complaint."
    );

  }


  return data.report;

}