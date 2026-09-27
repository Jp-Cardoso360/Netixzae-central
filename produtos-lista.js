const urlApiList = "https://netix-zae-api.vercel.app";
const productClientIds = new Map();
const productCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const clientPicker = document.querySelector("#clienteProduto");
const clientIdInput = document.querySelector(".id-user");
const productsList = document.querySelector(".produtos-list");
const productsFeedback = document.querySelector("#productsFeedback");
const addProductButton = document.querySelector(".newProduct");

function showProductsMessage(title, detail = "") {
  const message = document.createElement("div");
  message.className = "products-empty";

  const heading = document.createElement("h3");
  heading.textContent = title;
  message.appendChild(heading);

  if (detail) {
    const description = document.createElement("p");
    description.textContent = detail;
    message.appendChild(description);
  }

  productsList.replaceChildren(message);
}

function setProductsFeedback(message, state = "") {
  productsFeedback.textContent = message;
  productsFeedback.dataset.state = state;
}

async function carregarClientesProdutos() {
  try {
    const response = await fetch(`${urlApiList}/sessions-list-counts`);
    if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

    const clients = await response.json();
    const options = document.querySelector("#clientesProdutos");
    options.replaceChildren();

    clients.forEach((client) => {
      const id = String(client._id || "");
      if (!id) return;

      const option = document.createElement("option");
      option.value = `${client.nome || "Cliente sem nome"} · ${id.slice(-6)}`;
      options.appendChild(option);
      productClientIds.set(option.value, id);
    });
  } catch (error) {
    setProductsFeedback("Não foi possível carregar os clientes. Você ainda pode informar o ID manualmente.", "error");
    console.error("Erro ao carregar clientes:", error);
  }
}

clientPicker.addEventListener("change", () => {
  const selectedId = productClientIds.get(clientPicker.value);
  if (selectedId) clientIdInput.value = selectedId;
});

clientIdInput.addEventListener("input", () => {
  if (clientIdInput.value.trim()) clientPicker.value = "";
});

async function buscarProdutos() {
  const manualId = clientIdInput.value.trim();
  const selectedId = productClientIds.get(clientPicker.value);
  const id = manualId || selectedId;

  if (!id) {
    setProductsFeedback("Selecione um cliente ou informe o ID para continuar.", "error");
    return;
  }
  if (selectedId && !manualId) clientIdInput.value = selectedId;

  const loadButton = document.querySelector(".products-load");
  loadButton.disabled = true;
  addProductButton.hidden = true;
  setProductsFeedback("Carregando produtos...");
  showProductsMessage("Buscando produtos...");

  try {
    const response = await fetch(`${urlApiList}/dashboard/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

    const products = await response.json();
    if (!Array.isArray(products)) throw new Error("A resposta da API é inválida.");

    addProductButton.hidden = false;
    addProductButton.disabled = false;
    setProductsFeedback(`${products.length} ${products.length === 1 ? "produto encontrado" : "produtos encontrados"}.`);

    if (products.length === 0) {
      showProductsMessage("Este cliente ainda não tem produtos.", "Use “Adicionar produto” para criar o primeiro item do catálogo.");
      return;
    }

    const fragment = document.createDocumentFragment();
    products.forEach((product) => {
      const card = document.createElement("article");
      card.className = "produto product-card";

      const imageFrame = document.createElement("div");
      imageFrame.className = "product-card__image";
      const image = document.createElement("img");
      image.src = product.thumbnail_url || product.thumbnail || "";
      image.alt = product.description || "Imagem do produto";
      image.loading = "lazy";
      image.addEventListener("error", () => {
        image.hidden = true;
        imageFrame.classList.add("product-card__image--empty");
      });
      imageFrame.appendChild(image);

      const information = document.createElement("div");
      information.className = "product-card__information";
      const name = document.createElement("h3");
      name.textContent = product.description || "Produto sem nome";
      const description = document.createElement("p");
      description.textContent = product.description2 || "Sem descrição adicional";
      const price = document.createElement("strong");
      const numericPrice = Number(product.price);
      price.textContent = Number.isFinite(numericPrice)
        ? productCurrency.format(numericPrice)
        : String(product.price || "Preço não informado");
      information.append(name, description, price);

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "product-edit-button";
      editButton.innerHTML = '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i><span>Editar</span>';
      editButton.addEventListener("click", () => {
        openEdit(
          product._id,
          product.description || "",
          product.price || "",
          product.thumbnail_url || product.thumbnail || "",
          product.description2 || ""
        );
      });

      card.append(imageFrame, information, editButton);
      fragment.appendChild(card);
    });

    productsList.replaceChildren(fragment);
  } catch (error) {
    console.error("Erro na busca:", error);
    setProductsFeedback("Não foi possível carregar os produtos. Confira o cliente e tente novamente.", "error");
    showProductsMessage("Falha ao carregar os produtos.", error.message);
  } finally {
    loadButton.disabled = false;
  }
}

function openEdit(id, nome, valor, img, description2) {
  const edit = document.querySelector(".edit");
  edit.style.display = "flex";

  document.getElementById("att-nome").value = nome;
  document.querySelector(".nomeP").textContent = nome;
  document.getElementById("att-valor").value = valor;
  document.querySelector(".imgProduto").src = img;
  document.getElementById("description2").value = description2;

  const atualizarButton = document.querySelector(".att-produtos");
  atualizarButton.onclick = function () {
    atualizarP(id);
  };

  const apagar = document.querySelector(".apagarProduto");
  apagar.onclick = function () {
    apagarProduto(id, nome);
  }
  document.getElementById("att-nome").focus();
}

async function apagarProduto(id, nome) {
  if (!window.confirm(`Excluir “${nome}” deste catálogo?`)) return;

  try {
    const response = await fetch(`${urlApiList}/produto/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        user_id: clientIdInput.value.trim(),
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || result.message || `Erro na API: ${response.status}`);
    }

    document.querySelector(".edit").style.display = "none";
    await buscarProdutos();
    setProductsFeedback("Produto excluído com sucesso.", "success");
  } catch (error) {
    setProductsFeedback(`Não foi possível excluir o produto: ${error.message}`, "error");
  }
}

async function atualizarP(id) {
  const name = document.getElementById("att-nome").value.trim();
  const price = document.getElementById("att-valor").value;
  const description = document.getElementById("description2").value.trim();
  const saveButton = document.querySelector(".att-produtos");

  if (!name || price === "") {
    setProductsFeedback("Informe o nome e o preço do produto.", "error");
    return;
  }

  saveButton.disabled = true;
  try {
    const response = await fetch(`${urlApiList}/atualizar/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        user_id: clientIdInput.value.trim(),
      },
      body: JSON.stringify({
        description: name,
        description2: description,
        price,
        status: true,
      }),
    });

    if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

    document.querySelector(".edit").style.display = "none";
    await buscarProdutos();
    setProductsFeedback("Produto atualizado com sucesso.", "success");
  } catch (error) {
    console.error("Erro na atualização:", error);
    setProductsFeedback(`Não foi possível atualizar o produto: ${error.message}`, "error");
  } finally {
    saveButton.disabled = false;
  }
}

async function novoProduto() {
  const id = clientIdInput.value.trim();
  const name = document.getElementById("new-nome").value.trim();
  const price = document.getElementById("new-valor").value;
  const image = document.getElementById("linkImg").value.trim();
  const description = document.getElementById("new-description").value.trim();
  const createButton = document.querySelector(".new-produto");

  if (!id || !name || price === "" || !image) {
    setProductsFeedback("Preencha nome, preço e link da imagem.", "error");
    return;
  }

  createButton.disabled = true;
  try {
    const response = await fetch(`${urlApiList}/add-produto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user_id: id,
      },
      body: JSON.stringify({
        user_id: id,
        description: name,
        description2: description,
        price,
        status: true,
        thumbnail: image,
      }),
    });

    if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

    document.querySelector(".new-conteiner").style.display = "none";
    await buscarProdutos();
    setProductsFeedback("Produto criado com sucesso.", "success");
  } catch (error) {
    console.error("Erro na criação:", error);
    setProductsFeedback(`Não foi possível criar o produto: ${error.message}`, "error");
  } finally {
    createButton.disabled = false;
  }
}

const edit = document.querySelector(".edit");
const closeEdit = document.querySelector(".closeEdit");
const closeNew = document.querySelector(".closeNew");
const newConteiner = document.querySelector(".new-conteiner");

closeEdit.addEventListener("click", function () {
  edit.style.display = "none";
});

addProductButton.addEventListener("click", function () {
  document.getElementById("new-nome").value = "";
  document.getElementById("new-description").value = "";
  document.getElementById("new-valor").value = "";
  document.getElementById("linkImg").value = "";
  newConteiner.style.display = "flex";
  document.getElementById("new-nome").focus();
});

closeNew.addEventListener("click", function () {
  newConteiner.style.display = "none";
});

document.querySelector(".new-produto").addEventListener("click", novoProduto);
carregarClientesProdutos();
