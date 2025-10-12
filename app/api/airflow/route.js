export async function GET() {
  const res = await fetch('http://host.docker.internal:8080/data-endpoint'); // Airflow API veya JSON
  const data = await res.json();

  return new Response(JSON.stringify(data), { status: 200 });
}
