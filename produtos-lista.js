const isProductsLocalDevelopment = ["localhost", "127.0.0.1"].includes(location.hostname);
const urlApiList = isProductsLocalDevelopment
  ? "http://localhost:3333"
  : "https://netix-zae-api.vercel.app";
const maxProductImageSize = 5 * 1024 * 1024;
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
const newProductImage = document.querySelector("#new-product-image");
const editProductImage = document.querySelector("#edit-product-image");
const newCategorySelect = document.querySelector("#new-category");
const editCategorySelect = document.querySelector("#edit-category");
const categoryNameInput = document.querySelector("#category-name");
const categoryCreateButton = document.querySelector(".save-category");
const categoryFeedback = document.querySelector("#category-feedback");
const categoryList = document.querySelector("#category-list");
const categoryModal = document.querySelector(".category-conteiner");
const manageCategoriesButton = document.querySelector(".manageCategories");
const lastCreatedCategoryByUser = new Map();

function validateProductImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem.");
  }
  if (file.size > maxProductImageSize) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }
}

function updateImageSelection(input, messageId) {
  const message = document.getElementById(messageId);
  const file = input.files[0];
  message.textContent = "";
  message.dataset.state = "";
  if (!file) return;

  try {
    validateProductImage(file);
    message.textContent = `Arquivo selecionado: ${file.name}`;
  } catch (error) {
    message.textContent = error.message;
    message.dataset.state = "error";
  }
}

async function uploadProductImage(file, companyId) {
  validateProductImage(file);

  const formData = new FormData();
  formData.append("imagem", file);
  formData.append("empresaId", companyId);

  const response = await fetch(`${urlApiList}/upload`, {
    method: "POST",
    body: formData,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || result.message || `Erro no upload: ${response.status}`);
  }
  if (typeof result.url !== "string" || !result.url.trim()) {
    throw new Error("A resposta do upload não contém a URL da imagem.");
  }
  return result.url;
}

async function readProductResponse(response, action) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || result.message || `Erro ${action}: ${response.status}`);
  }
  return result;
}

async function loadProductCategories(select, companyId, selectedCategoryId = "") {
  select.dataset.loaded = "false";
  select.disabled = true;
  select.replaceChildren(new Option("Carregando categorias...", ""));

  try {
    const response = await fetch(`${urlApiList}/categories`, {
      headers: { user_id: companyId },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || result.message || `Erro na API: ${response.status}`);
    }

    const categories = Array.isArray(result) ? result : result.value;
    if (!Array.isArray(categories)) {
      throw new Error("A resposta de categorias é inválida.");
    }

    const options = document.createDocumentFragment();
    options.appendChild(new Option("Sem categoria", ""));
    categories.forEach((category) => {
      const id = String(category._id || "");
      if (!id) return;
      options.appendChild(new Option(category.nome || "Categoria sem nome", id));
    });
    select.replaceChildren(options);
    select.value = selectedCategoryId;
    select.dataset.loaded = "true";
  } catch (error) {
    select.replaceChildren(new Option("Não foi possível carregar categorias", ""));
    throw error;
  } finally {
    select.disabled = false;
  }
}

function setCategoryFeedback(message, state = "") {
  categoryFeedback.textContent = message;
  categoryFeedback.dataset.state = state;
}

async function loadCategoryManager() {
  const userId = clientIdInput.value.trim();
  const loadingItem = document.createElement("li");
  loadingItem.textContent = "Carregando categorias...";
  categoryList.replaceChildren(loadingItem);

  const response = await fetch(`${urlApiList}/categories`, {
    headers: { user_id: userId },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || result.message || `Erro na API: ${response.status}`);
  }

  const categories = Array.isArray(result) ? result : result.value;
  if (!Array.isArray(categories)) {
    throw new Error("A resposta de categorias é inválida.");
  }
  if (!categories.length) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "Nenhuma categoria cadastrada.";
    emptyItem.className = "category-list__empty";
    categoryList.replaceChildren(emptyItem);
    return;
  }

  const items = document.createDocumentFragment();
  categories.forEach((category) => {
    const id = String(category._id || "");
    if (!id) return;

    const item = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = category.nome || "Categoria sem nome";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "category-list__delete";
    deleteButton.setAttribute("aria-label", `Apagar categoria ${name.textContent}`);
    deleteButton.title = "Apagar categoria";
    deleteButton.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
    deleteButton.addEventListener("click", () => apagarCategoria(id, name.textContent, deleteButton));
    item.append(name, deleteButton);
    items.appendChild(item);
  });
  categoryList.replaceChildren(items);
}

async function apagarCategoria(id, nome, button) {
  const userId = clientIdInput.value.trim();
  if (!window.confirm(`Apagar a categoria “${nome}”?`)) return;

  button.disabled = true;
  try {
    const response = await fetch(`${urlApiList}/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        user_id: userId,
      },
    });
    await readProductResponse(response, "ao apagar categoria");

    if (lastCreatedCategoryByUser.get(userId) === id) {
      lastCreatedCategoryByUser.delete(userId);
    }
    const refreshResults = await Promise.allSettled([
      loadCategoryManager(),
      loadProductCategories(newCategorySelect, userId),
      loadProductCategories(editCategorySelect, userId),
    ]);
    const refreshFailed = refreshResults.some((result) => result.status === "rejected");
    setCategoryFeedback(
      refreshFailed ? "Categoria apagada. Não foi possível atualizar todos os seletores." : "Categoria apagada com sucesso.",
      refreshFailed ? "error" : "success"
    );
  } catch (error) {
    setCategoryFeedback(error.message || "Não foi possível apagar a categoria.", "error");
    button.disabled = false;
  }
}

async function criarCategoria() {
  const userId = clientIdInput.value.trim();
  const nome = categoryNameInput.value.trim();
  if (!userId || !nome) {
    setCategoryFeedback("Informe o nome da categoria.", "error");
    categoryNameInput.focus();
    return;
  }

  categoryCreateButton.disabled = true;
  setCategoryFeedback("Salvando categoria...");
  try {
    const response = await fetch(`${urlApiList}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user_id: userId,
      },
      body: JSON.stringify({ nome, user_id: userId }),
    });
    const result = await readProductResponse(response, "ao criar categoria");
    const category = result.category || result.value || result.data || result;
    let categoryId = String(category?._id || category?.id || "");

    await loadProductCategories(newCategorySelect, userId, categoryId);
    if (!categoryId) {
      const matchingCategory = [...newCategorySelect.options].find(
        (option) => option.textContent.trim().toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR")
      );
      categoryId = matchingCategory?.value || "";
    }
    if (!categoryId) {
      throw new Error("Categoria criada, mas não foi possível identificá-la na lista.");
    }

    lastCreatedCategoryByUser.set(userId, categoryId);
    categoryNameInput.value = "";
    categoryModal.style.display = "none";
    setProductsFeedback("Categoria criada com sucesso.", "success");
  } catch (error) {
    setCategoryFeedback(error.message || "Não foi possível salvar a categoria.", "error");
  } finally {
    categoryCreateButton.disabled = false;
  }
}

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

function resetProductResults(message) {
  const hasClient = Boolean(clientIdInput.value.trim());
  addProductButton.disabled = !hasClient;
  manageCategoriesButton.disabled = !hasClient;
  showProductsMessage("Busque produtos para este cliente.");
  setProductsFeedback(message);
}

async function carregarClientesProdutos() {
  try {
    const response = await fetch(`${urlApiList}/sessions-list-counts`);
    if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

    const clients = await response.json();
    if (!Array.isArray(clients)) throw new Error("A resposta de clientes é inválida.");

    const options = document.querySelector("#clientesProdutos");
    const optionFragment = document.createDocumentFragment();
    const clientIds = new Map();

    clients.forEach((client) => {
      const id = String(client._id || "");
      if (!id) return;

      const option = document.createElement("option");
      option.value = `${client.nome || "Cliente sem nome"} · ${id.slice(-6)}`;
      optionFragment.appendChild(option);
      clientIds.set(option.value, id);
    });

    options.replaceChildren(optionFragment);
    productClientIds.clear();
    clientIds.forEach((id, value) => productClientIds.set(value, id));
  } catch (error) {
    setProductsFeedback("Não foi possível carregar os clientes. Você ainda pode informar o ID manualmente.", "error");
    console.error("Erro ao carregar clientes:", error);
  }
}

function syncSelectedProductClient() {
  const selectedId = productClientIds.get(clientPicker.value);
  clientIdInput.value = selectedId || "";
  resetProductResults(selectedId
    ? "Cliente selecionado. Busque os produtos para continuar."
    : "Selecione um cliente ou informe o ID para continuar.");
}

clientPicker.addEventListener("input", syncSelectedProductClient);
clientPicker.addEventListener("change", syncSelectedProductClient);

clientIdInput.addEventListener("input", () => {
  if (clientIdInput.value.trim()) clientPicker.value = "";
  resetProductResults(clientIdInput.value.trim()
    ? "ID informado. Carregue os produtos para continuar."
    : "Selecione um cliente ou informe o ID para continuar.");
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
  addProductButton.disabled = true;
  setProductsFeedback("Carregando produtos...");
  showProductsMessage("Buscando produtos...");

  try {
    const response = await fetch(`${urlApiList}/dashboard/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

    const products = await response.json();
    if (!Array.isArray(products)) throw new Error("A resposta da API é inválida.");

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
          product.description2 || "",
          product.categoriaId?._id || product.categoriaId || ""
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
    addProductButton.disabled = !clientIdInput.value.trim();
    loadButton.disabled = false;
  }
}

async function openEdit(id, nome, valor, img, description2, categoriaId = "") {
  const edit = document.querySelector(".edit");
  edit.style.display = "flex";

  editProductImage.value = "";
  updateImageSelection(editProductImage, "edit-product-image-name");
  document.getElementById("att-nome").value = nome;
  document.querySelector(".nomeP").textContent = nome;
  document.getElementById("att-valor").value = valor;
  document.querySelector(".imgProduto").src = img;
  document.getElementById("description2").value = description2;
  const selectedCategoryId = categoriaId && typeof categoriaId === "object"
    ? String(categoriaId._id || "")
    : String(categoriaId || "");
  try {
    await loadProductCategories(editCategorySelect, clientIdInput.value.trim(), selectedCategoryId);
  } catch (error) {
    setProductsFeedback(`Não foi possível carregar as categorias: ${error.message}`, "error");
  }

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
  const image = editProductImage.files[0];
  const userId = clientIdInput.value.trim();

  if (editCategorySelect.dataset.loaded !== "true") {
    setProductsFeedback("Carregue as categorias antes de salvar o produto.", "error");
    return;
  }
  if (!name || price === "") {
    setProductsFeedback("Informe o nome e o preço do produto.", "error");
    return;
  }
  if (image) {
    try {
      validateProductImage(image);
    } catch (error) {
      setProductsFeedback(error.message, "error");
      return;
    }
  }

  saveButton.disabled = true;
  try {
    const product = {
      description: name,
      description2: description,
      price,
      status: true,
      categoriaId: editCategorySelect.value || null,
    };
    if (image) {
      setProductsFeedback("Enviando nova imagem...");
      product.thumbnail = await uploadProductImage(image, userId);
    }

    setProductsFeedback("Salvando alterações...");
    const response = await fetch(`${urlApiList}/atualizar/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        user_id: userId,
      },
      body: JSON.stringify(product),
    });

    await readProductResponse(response, "ao atualizar produto");

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
  const image = newProductImage.files[0];
  const description = document.getElementById("new-description").value.trim();
  const createButton = document.querySelector(".new-produto");

  if (newCategorySelect.dataset.loaded !== "true") {
    setProductsFeedback("Carregue as categorias antes de cadastrar o produto.", "error");
    return;
  }
  if (!id || !name || price === "" || !image) {
    setProductsFeedback("Preencha nome, preço e selecione uma imagem.", "error");
    return;
  }
  try {
    validateProductImage(image);
  } catch (error) {
    setProductsFeedback(error.message, "error");
    return;
  }

  createButton.disabled = true;
  try {
    setProductsFeedback("Enviando imagem...");
    const imageUrl = await uploadProductImage(image, id);

    setProductsFeedback("Cadastrando produto...");
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
        thumbnail: imageUrl,
        categoriaId: newCategorySelect.value || null,
      }),
    });

    await readProductResponse(response, "ao cadastrar produto");

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

addProductButton.addEventListener("click", async function () {
  document.getElementById("new-nome").value = "";
  document.getElementById("new-description").value = "";
  document.getElementById("new-valor").value = "";
  newProductImage.value = "";
  updateImageSelection(newProductImage, "new-product-image-name");
  newConteiner.style.display = "flex";
  try {
    const userId = clientIdInput.value.trim();
    await loadProductCategories(newCategorySelect, userId, lastCreatedCategoryByUser.get(userId) || "");
  } catch (error) {
    setProductsFeedback(`Não foi possível carregar as categorias: ${error.message}`, "error");
  }
  document.getElementById("new-nome").focus();
});

closeNew.addEventListener("click", function () {
  newConteiner.style.display = "none";
});

document.querySelector(".new-produto").addEventListener("click", novoProduto);
manageCategoriesButton.addEventListener("click", () => {
  if (!clientIdInput.value.trim()) {
    setProductsFeedback("Selecione um cliente ou informe o ID antes de criar categorias.", "error");
    return;
  }
  categoryNameInput.value = "";
  setCategoryFeedback("");
  categoryModal.style.display = "flex";
  categoryNameInput.focus();
  loadCategoryManager().catch((error) => {
    categoryList.replaceChildren();
    setCategoryFeedback(`Não foi possível carregar as categorias: ${error.message}`, "error");
  });
});
document.querySelector(".closeCategory").addEventListener("click", () => {
  categoryModal.style.display = "none";
});
categoryCreateButton.addEventListener("click", criarCategoria);
categoryNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    criarCategoria();
  }
});
newProductImage.addEventListener("change", () => updateImageSelection(newProductImage, "new-product-image-name"));
editProductImage.addEventListener("change", () => updateImageSelection(editProductImage, "edit-product-image-name"));
carregarClientesProdutos();
