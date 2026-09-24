async function contarUsuarios() {
  try {
    const response = await fetch(
      "https://netix-zae-api.vercel.app/sessions-list-counts"
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar a lista de usuários da API");
    }

    const usuarios = await response.json();

    const totalUsuarios = usuarios.length;

    document.getElementById(
      "total-usuarios"
    ).innerHTML = `Usuários: <br> ${totalUsuarios}`;
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

async function buscarReceitas() {
  try {
    const response = await fetch("https://netix-zae-api.vercel.app/receita");

    if (!response.ok) {
      throw new Error("Erro ao buscar receitas da API");
    }

    const receitas = await response.json();

    const total = receitas.reduce(
      (acc, receita) => acc + (receita.valor || 0),
      0
    );

    // Formata o valor total para o formato BRL
    const totalFormatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(total);

    document.getElementById(
      "total"
    ).innerHTML = `Receita: <br> ${totalFormatado}`;
  } catch (error) {
    console.error("Erro:", error.message);
  }
}
contarUsuarios();
buscarReceitas();

const apiURL = "https://netix-zae-api.vercel.app/sessions-list-counts";

async function DisplayAccounts() {
  try {
    // Fetch dados das APIs
    const accountsResponse = await fetch(apiURL);
    const accounts = await accountsResponse.json();

    const metasResponse = await fetch(`${urlApiList}/metas/list`);
    const metas = await metasResponse.json();

    const container = document.querySelector(".conteiner-clientes");
    container.innerHTML = "";

    // Iterar pelos usuários
    accounts.forEach((account) => {
      const detailsElement = document.createElement("details");

      const summary = document.createElement("summary");
      summary.textContent = account.nome || "Nome não disponível";
      detailsElement.appendChild(summary);

      const userMeta = metas.find((meta) => meta.user_id === account._id);
      if (userMeta) {
        const plano = document.createElement("p");
        plano.innerHTML = `Plano: ${userMeta.plano || "Plano não definido"}`;
        detailsElement.appendChild(plano);
      } else {
        const plano = document.createElement("p");
        plano.innerHTML = "Plano:<br> Plano não definido";
        detailsElement.appendChild(plano);
      }

      const p = document.createElement("p");
      p.innerHTML = `Link do sistema:`;
      detailsElement.appendChild(p);

      const link = document.createElement("a");
      link.href = `https://comercio-zap.netlify.app/${account._id}`;
      link.innerHTML = `https://comercio-zap.netlify.app/${account._id}`;
      detailsElement.appendChild(link);

      const id = document.createElement("p");
      id.innerHTML = `ID:<br> ${account._id}<br>`;
      detailsElement.appendChild(id);

      const whatsappLink = document.createElement("a");
      whatsappLink.href = account.tel ? `https://wa.me/${account.tel}` : "#";
      whatsappLink.innerHTML = account.tel
        ? `<i class="fa-brands fa-whatsapp"></i>`
        : "Telefone não disponível";
      detailsElement.appendChild(whatsappLink);

      container.appendChild(detailsElement);
    });
  } catch (error) {
    console.error("Erro ao buscar os dados:", error);
  }
}

DisplayAccounts();

const upadate = document.querySelector(".upadate");
const load = document.querySelector(".loading");
const loadMensage = document.querySelector(".loadMensage");

upadate.addEventListener("click", function () {
  load.style = "display:flex";
  loadMensage.innerHTML = "Atualizando..";
  buscarReceitas();
  contarUsuarios();
  DisplayAccounts();

  setTimeout(function () {
    load.style = "display:none";
  }, 4000);
});
