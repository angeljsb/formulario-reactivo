//namespace
var Reactive = {
  /**
   * Crea un elemento con los atributos e hijos especificados
   *
   * @param {string} tagName El nombre de la etiqueta del elemento
   * @param {any} options Un objeto con los atributos que se le
   * desea añadir a la etiqueta html
   * @param {HTMLElement[]} children Un arreglo de elementos
   */
  createElement: (tagName, options = {}, children = []) => {
    const elemento = document.createElement(tagName);

    for (let key in options) {
      if (elemento[key] !== undefined) {
        elemento[key] = options[key];
      }
    }

    children.forEach((value) => {
      elemento.appendChild(value);
    });

    return elemento;
  },

  /**
   * Convierte un string en formato html en un elemento del DOM
   *
   * @param {string} htmlText El string en formato html
   *
   * @return {HTMLElement} El elemento definido por la primera etiqueta
   * que se abra y se cierre en el string recibido
   */
  fromHTML: (htmlText) => {
    const normalizedText = htmlText.trim().replace(/>\s+</g, "><");
    const div = document.createElement("div");
    div.innerHTML = normalizedText;
    return div.children[0];
  },
};

Reactive.EffectHandler = () => {
  const al = {};
  const globals = [];

  /**
   * Añade una acción a una llave. Al activar dicha llave, todos
   * los efectos secundarios añadidos a ella se activan.
   *
   * @param {string} key La llave a la que añadir la acción
   * @param {()=>void} action Acción a ejecutar al cambiar
   * el estado
   */
  const add = (key, action) => {
    if (!action instanceof Function)
      throw TypeError("action is not a function");
    if (!al[key]) {
      al[key] = [];
    }
    al[key].push(action);
  };
  /**
   * Añade un efecto secundario que se activa sin importar a cual de las
   * llaves corresponda la llamada.
   *
   * @param {(key: string) => void} action La acción a añadir
   */
  const addGlobal = (action) => {
    if (!action instanceof Function)
      throw TypeError("action is not a function");
    globals.push(action);
  };
  /**
   * Remueve un efecto secundario que dejará de activarse al despachar
   * su llave.
   *
   * Si no se pasa una acción, se remueven todas las acciones para dicha
   * llave
   *
   * @param {string} key El nombre de la llave en la que está ese efecto
   * @param {()=>void | false} action Acción que se desea remover
   *
   * @return {boolean} Si la acción fue removida correctamente
   */
  const remove = (key, action = false) => {
    if (!al[key]) {
      return false;
    }
    if (!action) {
      al[key] = [];
      return true;
    }
    const i = al[key].indexOf(action);
    if (i > -1) {
      al[key].splice(i, 1);
      return true;
    }
    return false;
  };
  /**
   * Remueve una acción global, que dejará de ejecutarse al llamar
   * cualquier llave.
   *
   * @param {(key: string)=>boolean | false}  action La acción global a
   * remover. Si no se añade una, remuve todas las acciones globales
   *
   * @return {boolean} Si se pudo remover alguna acción
   */
  const removeGlobal = (action = false) => {
    if (!action) {
      const rem = globals.splice(0);
      return rem.length > 0;
    }
    const i = globals.indexOf(action);
    if (i > -1) {
      globals.splice(i, 1);
      return true;
    }
    return false;
  };
  /**
   * Activa los events globales
   *
   * @param {string} key La llave que activó los efectos globales si la
   * hay
   */
  const dispatchGlobals = (key = "") => {
    globals.forEach((funct) => funct(key));
  };
  /**
   * Activa los eventos correspondientes a una llave, evitando la
   * activación de los eventos globales
   *
   * @param {string} key La llave cuyos efectos se activarán
   */
  const dispatchIgnoreGlobals = (key) => {
    if (al[key]) {
      al[key].forEach((funct) => funct());
    }
  };
  /**
   * Activa todos los eventos correspondientes a una llave y los globales
   * como efectos secundarios de las mismas
   *
   * Es el metodo normal para activar las funciones relacionadas a una
   * llave
   *
   * @param {string} key La llave
   */
  const dispatch = (key = null) => {
    dispatchIgnoreGlobals(key);

    dispatchGlobals(key);
  };

  return {
    add,
    addGlobal,
    remove,
    removeGlobal,
    dispatchGlobals,
    dispatchIgnoreGlobals,
    dispatch,
  };
};

const _state = (state = {}) => {
  let s = { ...state };
  return {
    value: () => JSON.parse(JSON.stringify(s)),
    change: (key, value) => {
      if (s.hasOwnProperty(key)) {
        const prev = s[key];
        s[key] = value;
        return prev !== value;
      }
      return false;
    },
  };
};

/**
 * Define un componente reactivo
 * @param {Node} element El elemento padre del componente
 * @param {any} state El estado inicial del componente reactivo
 * @param {(props:any)=>HTMLElement} template Función que devuelve un
 * elemento html condicionado por el estado y props actuales, el cual será
 * renderizado cada vez que estos cambien
 */
Reactive.Component = function (template, initState = {}) {
  this._state = _state(initState);
  this._props = {};
  if (template) this.template = template.bind(this);
  this.sideEffects = Reactive.EffectHandler();
};

Reactive.Component.prototype = {
  constructor: Reactive.Component,

  /**
   * Función para cambiar el estado de un componente reactivo.
   * Recibe un objeto el cual alguna de sus llaves debe coincidir con
   * uno de los estados, de ser así, actualiza el estado y vuelve a
   * renderizar el dom en base a el
   *
   * @param {any} newState Un objeto con los estados a cambiar.
   */
  setState: function (newState) {
    const keys = Object.keys(newState);

    const changed = keys.filter((key) =>
      this._state.change(key, newState[key])
    );

    changed.forEach(this.sideEffects.dispatchIgnoreGlobals);

    if (changed.length > 0) {
      this.sideEffects.dispatchGlobals(changed);
      this.render();
    }
  },

  /**
   * Función que renderiza el dom según la devolución de template
   */
  render: function () {
    const newTemp = this.template(this);
    newTemp.component = this;

    if (!this.element || !this.element.isEqualNode(newTemp)) {
      const node = this.element
        ? this.copyNode(this.element, newTemp)
        : newTemp;
      this.element = node;
      this.element.component = this;
      this.putEvents();
    }
  },

  /**
   * Función que copia un nodo en otro. Si ambos nodos son completamente
   * diferentes, solo remplaza el primero con el segundo. De haber
   * similitudes suficientes, se modificarán los atributos del primer
   * nodo para volverlo identico al segundo.
   *
   * En el segundo caso, también se aplicará la misma operación a todos
   * los hijos que haya en común entre ambos nodos
   * @param into El nodo que se quiere igualar a otro
   * @param node El nodo que se va a copiar en el otro
   * @returns {Node} El nodo que está en el DOM luego de ejecutarse la
   * acción. Puede ser cualquiera de los dos parametros
   */
  copyNode: function (into, node) {
    if (into === node) return into;
    if (
      into.tagName !== node.tagName ||
      into.nodeType === Node.TEXT_NODE ||
      node.nodeType === Node.TEXT_NODE ||
      (into.component && !node.component)
    ) {
      into.replaceWith(node);
      return node;
    }
    if (node.component && into.component !== node.component) {
      into.replaceWith(node);
      node.component.putEvents(node);
      return node;
    }
    if (into.isEqualNode(node)) {
      return into;
    }

    if (into.childNodes.length > node.childNodes.length) {
      const l = node.childNodes.length;
      while (into.childNodes[l]) {
        into.removeChild(into.childNodes[l]);
      }
    }

    into
      .getAttributeNames()
      .filter((name) => !node.getAttributeNames().includes(name))
      .forEach((name) => into.removeAttribute(name));

    Array.from(node.childNodes).forEach((val, index) => {
      let childInto = into.childNodes[index];
      if (!childInto) {
        into.appendChild(val.component ? val : val.cloneNode(true));
        return;
      }
      this.copyNode(childInto, val);
    });

    Array.from(node.attributes).forEach((val) => {
      into.setAttribute(val.name, val.value);
      if (val.name === "value") {
        into.value = val.value;
      }
    });

    return into;
  },

  /**
   * Si el objeto tiene un arreglo de eventos, se encarga de colocar
   * todos los eventos en su respectivo componente cada vez que
   * se vuelva a renderizar
   */
  putEvents: function (el = this.element) {
    if (!this.events) return;
    this.events.forEach((current) => {
      if (!current._listener) {
        current._listener = current.selector
          ? (e) => {
              const tar = e.target.closest(current.selector);
              if (!tar) return;
              current.listener.call(this, e);
            }
          : current.listener.bind(this);
      }
      el.addEventListener(current.type, current._listener);
    });
  },

  /**
   * Añade una función que se activa al cambiar un estado del componente
   *
   * @param {string} key El nombre del estado
   * @param {()=>void} action La función que se ejecutará al cambiar el
   * estado.
   */
  onChangeState: function (key, action) {
    this.sideEffects.add(key, action);
  },

  /**
   * Añade una función que se ejecuta al cambiar cualquier estado.
   *
   * De cambiar varios estados, esta función se ejecuta para cada uno.
   *
   * @param {(key:string[])=>void} action La función que se ejecutará en cada
   * cambio de estado
   */
  onChangeAny: function (action) {
    this.sideEffects.addGlobal(action);
  },

  /**
   * Remueve una o todas las funciones añadidas como efectos secundarios
   * por onChangeState
   *
   * @param {string} key El nombre del estado al cual remover el efecto
   * @param {()=>void | false} action La acción a remover. De no pasarse
   * este parametro o pasar false, se eliminarán todos los efectos
   * secundarios para ese estado
   *
   * @return {boolean} Si se removió algún efecto
   */
  offChangeState: function (key, action = false) {
    return this.sideEffects.remove(key, action);
  },

  /**
   * Remueve una o todas las funciones añadidas como efectos secundarios
   * globales por onChangeAny
   *
   * @param {(key:string)=>void | false} action La función a remover de los
   * efectos secundarios. De no pasarse este parametro o pasar false se
   * removeran todos los efectos secundarios globales
   */
  offChangeAny: function (action = false) {
    return this.sideEffects.removeGlobal(action);
  },

  /**
   * Añade un eventListener al componente reactivo o a uno de los
   * elementos que lo conforman señalado por un selector
   *
   * @param {string} type El tipo de evento
   * @param {(Event)=>void} listener Función que se activará al
   * activarse el evento
   * @param {string} selector El selector del elemento al que se le
   * añadirá el eventListener. Si no se pasa uno, el eventListener se
   * añade en el elemento base del componente
   */
  addEventListener: function (type, listener, selector = null) {
    this.events = this.events || [];
    this.events.push({ type, listener, selector });

    if (this.element) {
      this.putEvents();
    }
  },

  /**
   * Remueve un eventListener del componente
   *
   * @param {string} type El tipo de evento
   * @param {(Event)=>void} listener El eventListener a remover
   * @param {string} selector El selector al que está añadido el
   * eventListener si es que lo hay
   */
  removeEventListener: function (type, listener, selector = null) {
    if (!this.events) return;

    const remove = this.events.findIndex(
      (event) =>
        event.type === type &&
        event.listener === listener &&
        ((!event.selector && !selector) || event.selector === selector)
    );

    if (remove >= 0) {
      const event = this.events[remove];
      if (this.element && event._listener) {
        this.element.removeEventListener(event.type, event._listener);
      }
      this.events.splice(remove, 1);
    }
  },

  /**
   * Renderiza el componente y retorna el elemento html actual del
   * mismo
   *
   * @param {any} props Un objeto con un conjunto de propiedades que
   * pueden ser leídas desde la función template para condicionar
   * la vista
   */
  get: function (props = {}) {
    this._props = { ...props };

    this.render();

    return this.element;
  },

  get props() {
    return { ...this._props };
  },

  /**
   * El estado solo se puede definir una vez. De intentar sobreescribirlo
   * lanzará un error
   */
  set state(state) {
    throw new Error("The state is inmutable");
  },

  /**
   * Devuelve una copia inmutable del estado
   */
  get state() {
    return this._state.value();
  },
};

/**
 * @typedef ComponentConfig
 * @property {(props?:any) => HTMLElement} template Una función plantilla
 * que recibe un objeto props y tiene acceso a this.state, y debe basarse
 * en ellas para crear un html element que será lo que se renderizará como
 * element
 * @property {*} initState El estado inicial de todos los objetos de la clase
 * devuelta
 * @property {*} definitions Campos extra que se van a añadir a los objetos de
 * la nueva clase. Sí es una función, esta se ejecutará en el
 * contexto del constructor de la nueva clase
 */

/**
 * Genera un tipo de componente a partir de una plantilla y un conjunto
 * configuraciones
 *
 * @param {ComponentConfig} componentConfig Objeto de configuración
 * para crear el nuevo componente
 * @returns {Function} Un constructor del componente reactivo asociado
 * al template. Este constructor recibe un objeto
 * props y renderiza un elemento en base a dicho objeto y al estado
 */
Reactive.createComponent = (componentConfig = {}) => {
  const template = componentConfig.template;
  const initialState = componentConfig.initialState || {};
  const definitions = componentConfig.definitions || {};
  const events = componentConfig.events || [];
  function _Comp() {
    Reactive.Component.call(this, null, initialState);
    this.events = events
      .filter((e) => e.type && e.listener)
      .map((e) => {
        return { ...e };
      });

    if (definitions) {
      if (definitions instanceof Function) {
        definitions.call(this);
      } else {
        const ex = { ...definitions };
        for (let i in ex) {
          this[i] = ex[i];
        }
      }
    }
  }
  _Comp.prototype = Object.create(Reactive.Component.prototype);
  _Comp.prototype.template = template;
  _Comp.prototype.constructor = _Comp;

  return _Comp;
};
