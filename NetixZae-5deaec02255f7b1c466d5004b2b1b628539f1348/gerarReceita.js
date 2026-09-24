const urlNetixZae2 = "https://netix-zae-api.vercel.app";

async function gerarReceita() {
  const nome = document.querySelector(".nome").value;
  const valor = document.getElementById("receita").value;
  const load = document.querySelector(".loading");
  const loadMensage = document.querySelector(".loadMensage");

  if (nome == "" || valor == "") {
    alert("Preencha todos os campos");
    return;
  }

  try {
    load.style = "display:flex;";
    loadMensage.innerHTML = "Gerando Receita";

    const req = await fetch(`${urlNetixZae2}/receita`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome,
        valor,
      }),
    });

    console.log("Status da requisição:", req.status);

    if (!req.ok) {
      throw new Error(`Erro na API: ${req.status}`);
    }

    const res = await req.json();
    load.style = "display:none;";

    alert("Receita Gerada com sucesso");
  
  } catch (error) {
    const res = await req.json();
    alert("Erro encontrado:", res.error);
  }
}
