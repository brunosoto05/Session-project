// Llama al endpoint unico con el numero de transaccion y sus parametros
const toProcess = async (tx, params = []) => {
  const response = await fetch('/toProcess', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tx, params })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error');
  }
  return data;
};

export default toProcess;
