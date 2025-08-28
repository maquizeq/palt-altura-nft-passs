// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title AlturaNFTPasss
/// @notice Sistema de membresías basado en ERC721 con niveles, expiración y pagos en ETH
/// @dev Para demo: los pagos quedan en el contrato y son retirables por el owner.
contract AlturaNFTPasss is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    struct Nivel {
        uint96 precioWei; // precio en wei para comprar o renovar
        uint32 duracion;  // segundos de validez por compra/renovación
        bool activo;      // si el nivel está disponible para compra
    }

    // nivelId => Nivel
    mapping(uint256 => Nivel) public niveles;
    uint256 public proximoNivelId;

    // tokenId => timestamp de expiración (unix seconds)
    mapping(uint256 => uint256) public expiracionDe;
    // tokenId => nivelId
    mapping(uint256 => uint256) public nivelDe;

    // id incremental de token
    uint256 private _proximoTokenId = 1;

    // baseURI para metadata
    string private _uriBase;

    // suministro máximo permitido
    uint256 public suministroMaximo;

    // Eventos
    event NivelCreado(uint256 indexed nivelId, uint96 precioWei, uint32 duracion);
    event NivelActualizado(uint256 indexed nivelId, uint96 precioWei, uint32 duracion, bool activo);
    event MembresiaComprada(address indexed comprador, uint256 indexed tokenId, uint256 indexed nivelId, uint256 expiracion);
    event MembresiaRenovada(address indexed renovador, uint256 indexed tokenId, uint256 indexed nivelId, uint256 nuevaExpiracion);
    event Retiro(address indexed a, uint256 monto);

    constructor(
        string memory nombre_,
        string memory simbolo_,
        string memory baseURI_,
        uint256 maximoSuministro_
    ) ERC721(nombre_, simbolo_) Ownable(msg.sender) {
        require(maximoSuministro_ > 0, "maximo=0");
        _uriBase = baseURI_;
        suministroMaximo = maximoSuministro_;
    }

    // ----------- Funciones de admin (owner) ----------- //

    function crearNivel(uint96 precioWei, uint32 duracion) external onlyOwner returns (uint256 nivelId) {
        require(duracion > 0, "duracion=0");
        nivelId = proximoNivelId++;
        niveles[nivelId] = Nivel({precioWei: precioWei, duracion: duracion, activo: true});
        emit NivelCreado(nivelId, precioWei, duracion);
    }

    function actualizarNivel(uint256 nivelId, uint96 precioWei, uint32 duracion, bool activo) external onlyOwner {
        require(nivelId < proximoNivelId, "nivel no existe");
        require(duracion > 0, "duracion=0");
        niveles[nivelId] = Nivel({precioWei: precioWei, duracion: duracion, activo: activo});
        emit NivelActualizado(nivelId, precioWei, duracion, activo);
    }

    function establecerBaseURI(string calldata nuevoBase) external onlyOwner {
        _uriBase = nuevoBase;
    }

    function retirar(address payable a, uint256 monto) external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(monto <= bal, "insuficiente");
        (bool ok, ) = a.call{value: monto}("");
        require(ok, "fallo retiro");
        emit Retiro(a, monto);
    }

    // ----------- Funciones públicas de usuario ----------- //

    /// @notice Compra una membresía de un nivel pagando ETH; acuña un nuevo NFT
    function comprar(uint256 nivelId) external payable nonReentrant returns (uint256 tokenId) {
        // Verificar límite de suministro (antes de incrementar el ID)
        require((_proximoTokenId - 1) < suministroMaximo, "suministro agotado");
        Nivel memory n = niveles[nivelId];
        require(n.activo, "nivel inactivo");
        require(msg.value == n.precioWei, "precio");

        tokenId = _proximoTokenId++;
        _safeMint(msg.sender, tokenId);
        nivelDe[tokenId] = nivelId;

        uint256 exp = block.timestamp + n.duracion;
        expiracionDe[tokenId] = exp;
        emit MembresiaComprada(msg.sender, tokenId, nivelId, exp);
    }

    /// @notice Renueva la membresía pagando el precio del nivel; extiende desde expiración actual o desde ahora
    function renovar(uint256 tokenId) external payable nonReentrant {
        require(_ownerOf(tokenId) != address(0), "!token");
        // OpenZeppelin v5: _isAuthorized(owner, spender, tokenId)
        require(_isAuthorized(_ownerOf(tokenId), msg.sender, tokenId), "!autorizado");
        uint256 nId = nivelDe[tokenId];
        Nivel memory n = niveles[nId];
        require(n.activo, "nivel inactivo");
        require(msg.value == n.precioWei, "precio");

        uint256 base = block.timestamp > expiracionDe[tokenId] ? block.timestamp : expiracionDe[tokenId];
        uint256 nuevaExp = base + n.duracion;
        expiracionDe[tokenId] = nuevaExp;
        emit MembresiaRenovada(msg.sender, tokenId, nId, nuevaExp);
    }

    // ----------- Vistas / helpers ----------- //

    function tokenActivo(uint256 tokenId) public view returns (bool) {
        return expiracionDe[tokenId] >= block.timestamp;
    }

    function esMiembro(address cuenta) external view returns (bool) {
        // chequeo simple: si algún token del dueño sigue activo
        uint256 supply = _proximoTokenId - 1;
        for (uint256 i = 1; i <= supply; i++) {
            if (_ownerOf(i) == cuenta && expiracionDe[i] >= block.timestamp) return true;
        }
        return false;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return bytes(_uriBase).length == 0
            ? ""
            : string(abi.encodePacked(_uriBase, tokenId.toString(), ".json"));
    }

    function _baseURI() internal view override returns (string memory) {
        return _uriBase;
    }
}
