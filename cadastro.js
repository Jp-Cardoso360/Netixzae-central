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
      const nomeCliente = String(res.user.nome || nome || "cliente").trim();
      const linkLogin = "https://meu-carrinho-login.netlify.app";
      const linkSistema = `https://comercio-zap.netlify.app/${res.user._id}`;

      cadastro.style = "display:none;";
      sucess.style = "display:flex;";

      dados_email.replaceChildren();
      dados_email.innerHTML = `<strong>E-mail</strong><span></span>`;
      dados_email.querySelector("span").textContent = res.user.email || email;
      dados_senha.replaceChildren();
      dados_senha.innerHTML = `<strong>Senha</strong><span></span>`;
      dados_senha.querySelector("span").textContent = senha;
      login_res.replaceChildren();
      login_res.innerHTML = `<strong>Portal de acesso</strong><a target="_blank" rel="noopener noreferrer"></a>`;
      login_res.querySelector("a").href = linkLogin;
      login_res.querySelector("a").textContent = linkLogin;
      dados_link.replaceChildren();
      dados_link.innerHTML = `<strong>Link do sistema</strong><a target="_blank" rel="noopener noreferrer"></a>`;
      dados_link.querySelector("a").href = linkSistema;
      dados_link.querySelector("a").textContent = linkSistema;

      document.querySelector(".mensagem-saudacao").textContent = `Olá, ${nomeCliente}!`;
      document.querySelector(".mensagem-link").textContent = `Link do seu sistema: ${linkSistema}`;
      document.querySelector(".mensagem-login").textContent = `Portal de acesso: ${linkLogin}`;
      document.querySelector(".mensagem-email").textContent = `E-mail: ${res.user.email || email}`;
      document.querySelector(".mensagem-senha").textContent = `Senha: ${senha}`;
      document.querySelector(".share-whatsapp").dataset.telefone = tel;
  } catch (error) {
    console.error("Erro encontrado:", error);
    alert(error.message || "Tente novamente");
  } finally {
    load.style.display = "none";
  }
}

function getMensagemCliente() {
  const message = document.querySelector("#mensagemCliente");
  return [...message.querySelectorAll("p, li")]
    .map((element) => element.textContent.trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n(?=\d+\.)/g, "\n");
}

function enviarMensagemWhatsApp() {
  const button = document.querySelector(".share-whatsapp");
  const phone = button.dataset.telefone.replace(/\D/g, "");
  const message = encodeURIComponent(getMensagemCliente());
  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${message}`
    : `https://wa.me/?text=${message}`;

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}

async function copiarMensagemCliente() {
  try {
    await navigator.clipboard.writeText(getMensagemCliente());
    const button = document.querySelector(".share-copy");
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Mensagem copiada';
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  } catch (error) {
    const temporaryField = document.createElement("textarea");
    temporaryField.value = getMensagemCliente();
    temporaryField.style.position = "fixed";
    temporaryField.style.opacity = "0";
    document.body.appendChild(temporaryField);
    temporaryField.select();
    document.execCommand("copy");
    temporaryField.remove();
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
