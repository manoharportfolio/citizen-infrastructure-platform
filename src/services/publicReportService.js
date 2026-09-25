const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";


// ============================================================
// GET PUBLIC REPORTS
// ============================================================

export async function getPublicReports(
  filters = {}
) {
  const params =
    new URLSearchParams();


  Object.entries(
    filters
  ).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        params.append(
          key,
          value
        );
      }
    }
  );


  const query =
    params.toString();


  const url =
    `${API_URL}/api/reports/public` +
    (
      query
        ? `?${query}`
        : ""
    );


  const response =
    await fetch(url);


  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }


  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load public complaints."
    );
  }


  return data;
}


// ============================================================
// GET ONE PUBLIC REPORT
// ============================================================

export async function getPublicReportById(
  reportId
) {
  if (!reportId) {
    throw new Error(
      "Complaint ID is required."
    );
  }


  const response =
    await fetch(
      `${API_URL}/api/reports/public/${encodeURIComponent(
        reportId
      )}`
    );


  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }


  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load complaint."
    );
  }


  return data;
}