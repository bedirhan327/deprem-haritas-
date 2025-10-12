'use client';

import { useEffect, useState } from 'react';

export default function DataViewer() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/airflow')
      .then(res => res.json())
      .then(json => setData(json));
  }, []);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
