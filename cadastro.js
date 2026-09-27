const urlNetixZae = "https://netix-zae-api.vercel.app";

async function criarConta() {
  const nome = document.getElementById("nome").value;
  const tel = document.getElementById("tel").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const corSistema = document.getElementById("corSistema").value;



  const load = document.querySelector(".loading");
  const loadMensage = document.querySelector(".loadMensage");

  if (email == "" || senha == "" || tel == "" || corSistema == "") {
    alert("Preencha todos os campos");
    return;
  }
  if (senha.length < 4) {
    alert("A Senha deve ter no minimo 4 digitos");
    return;
  }

  try {
    load.style = "display:flex;";
    loadMensage.innerHTML = `Criando sistema <br> para ${nome}...`;

    const req = await fetch(`${urlNetixZae}/sessions/create/acount`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: nome,
        tel: tel,
        email: email,
        senha: senha,
        corSistema: corSistema,
      }),
    });

    if (!req.ok) {
      throw new Error(`Erro na API: ${req.status}`);
    }

    const res = await req.json();
    if (!res.user) {
      throw new Error("Resposta da API sem os dados do usuário");
    }

      const sucess = document.querySelector(".sucess");
      const cadastro = document.querySelector(".cadastro");
      const dados_email = document.querySelector(".email-res");
      const dados_senha = document.querySelector(".senha-res");
      const dados_link = document.querySelector(".link-res");
      const login_res = document.querySelector(".login-res");

      cadastro.style = "display:none;";
      sucess.style = "display:flex;";

      dados_email.innerHTML = `<strong>Email:</strong> <br> ${res.user.email}`;
      dados_senha.innerHTML = `<strong>Senha</strong>:<br> ${senha}`;
      login_res.innerHTML = `<strong>Link login:</strong> <br> <a href ="https://meu-carrinho-login.netlify.app" target="_blank">https://meu-carrinho-login.netlify.app</a>`;
      dados_link.innerHTML = ` <strong>Link do site:</strong> <br> <a href ="https://comercio-zap.netlify.app/${res.user._id}" target="_blank">https://comercio-zap.netlify.app/${res.user._id}</a>`;
  } catch (error) {
    console.error("Erro encontrado:", error);
    alert(error.message || "Tente novamente");
  } finally {
    load.style.display = "none";
  }
}

async function deleteUser() {
  const userIdInput = document.getElementById("idUser");
  const userId = userIdInput.value.trim();

  if (!userId) {
    alert("Preencha todos os campos");
    userIdInput.focus();
    return;
  }

  const deleteButton = document.querySelector(".conteiner-delete button");
  deleteButton.disabled = true;

  try {
    const response = await fetch(`${urlNetixZae}/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: {
        "Content-type": "application/json",
      },
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || `Erro na API: ${response.status}`);
    }

    userIdInput.value = "";
    alert(result.message || "Usuário apagado com sucesso.");
    closeDel();
    await Promise.all([DisplayAccounts(), contarUsuarios()]);
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    alert(error.message || "Erro ao excluir usuário.");
  } finally {
    deleteButton.disabled = false;
  }
}

async function salvarMetas() {
  const metaUp = document.getElementById("metaUp").value;
  const idUp = document.getElementById("idUp").value;
  const plano = document.getElementById("plano").value;

  if (idUp == "" || metaUp == "") {
    alert("Preencha todos os campos");
    return;
  }
  try {
    const req = await fetch(`${urlNetixZae}/metas/${idUp}`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        meta: metaUp,
        plano: plano,
      }),
    });

    if (!req.ok) {
      console.error("Erro na api");
    }

    const res = await req.json();

    alert("Meta criada com sucesso");
    idUp.value = "";
  } catch {
    alert("Erro ao excluir");
  }
}
