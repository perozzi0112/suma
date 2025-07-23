"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/clean_firestore_and_auth.ts
var app_1 = require("firebase-admin/app");
var firestore_1 = require("firebase-admin/firestore");
var auth_1 = require("firebase-admin/auth");
var dotenv = __importStar(require("dotenv"));
dotenv.config();
if (!(0, app_1.getApps)().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
        });
    }
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        (0, app_1.initializeApp)();
    }
    else {
        throw new Error('No se encontraron credenciales de Firebase Admin.');
    }
}
var db = (0, firestore_1.getFirestore)();
var auth = (0, auth_1.getAuth)();
var ADMIN_EMAIL = 'Perozzi0112@gmail.com';
function cleanUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var usersRef, snapshot, _i, _a, doc, data, nextPageToken, listUsersResult, _b, _c, userRecord;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    usersRef = db.collection('users');
                    return [4 /*yield*/, usersRef.get()];
                case 1:
                    snapshot = _d.sent();
                    _i = 0, _a = snapshot.docs;
                    _d.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    doc = _a[_i];
                    data = doc.data();
                    if (!(data.email !== ADMIN_EMAIL)) return [3 /*break*/, 4];
                    return [4 /*yield*/, doc.ref.delete()];
                case 3:
                    _d.sent();
                    console.log("Usuario Firestore eliminado: ".concat(data.email));
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    nextPageToken = undefined;
                    _d.label = 6;
                case 6: return [4 /*yield*/, auth.listUsers(1000, nextPageToken)];
                case 7:
                    listUsersResult = _d.sent();
                    _b = 0, _c = listUsersResult.users;
                    _d.label = 8;
                case 8:
                    if (!(_b < _c.length)) return [3 /*break*/, 11];
                    userRecord = _c[_b];
                    if (!(userRecord.email !== ADMIN_EMAIL)) return [3 /*break*/, 10];
                    return [4 /*yield*/, auth.deleteUser(userRecord.uid)];
                case 9:
                    _d.sent();
                    console.log("Usuario Auth eliminado: ".concat(userRecord.email));
                    _d.label = 10;
                case 10:
                    _b++;
                    return [3 /*break*/, 8];
                case 11:
                    nextPageToken = listUsersResult.pageToken;
                    _d.label = 12;
                case 12:
                    if (nextPageToken) return [3 /*break*/, 6];
                    _d.label = 13;
                case 13: return [2 /*return*/];
            }
        });
    });
}
function cleanAppointments() {
    return __awaiter(this, void 0, void 0, function () {
        var appointmentsRef, snapshot, _i, _a, doc;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    appointmentsRef = db.collection('appointments');
                    return [4 /*yield*/, appointmentsRef.get()];
                case 1:
                    snapshot = _b.sent();
                    _i = 0, _a = snapshot.docs;
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    doc = _a[_i];
                    return [4 /*yield*/, doc.ref.delete()];
                case 3:
                    _b.sent();
                    console.log("Cita eliminada: ".concat(doc.id));
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, cleanUsers()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, cleanAppointments()];
                case 2:
                    _a.sent();
                    console.log('Limpieza completada.');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error('Error en limpieza:', err);
    process.exit(1);
});
