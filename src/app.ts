import express, { Express, Request, Response } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import logger from "morgan";
import assert from "assert";

import { EthrDID } from "ethr-did";
import { Resolver } from "did-resolver";
import { getResolver } from "ethr-did-resolver";

import { AsyncHandler, ErrorHandler, Status } from "./common";

import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";

const {
  KALEIDO_HOST,
  KALEIDO_USER,
  KALEIDO_PASS,
  DID_ETHR_CHAIN_ID,
  DID_ETHR_REGISTRY_ADDR,
} = process.env;

assert(typeof KALEIDO_HOST === "string");
assert(typeof KALEIDO_USER === "string");
assert(typeof KALEIDO_PASS === "string");

assert(typeof DID_ETHR_CHAIN_ID === "string");
assert(typeof DID_ETHR_REGISTRY_ADDR === "string");

const provider = new JsonRpcProvider({
  url: KALEIDO_HOST,
  user: KALEIDO_USER,
  password: KALEIDO_PASS,
});

const app: Express = express();

app.use(logger("dev"));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.post(
  "/:externalId",
  AsyncHandler(async function (req: Request, res: Response) {
    const { externalId } = req.params;

    try {
      const keypair = EthrDID.createKeyPair(DID_ETHR_CHAIN_ID);

      const txSigner = new Wallet(keypair.privateKey, provider);
      const did = new EthrDID({
        ...keypair,
        provider,
        registry: DID_ETHR_REGISTRY_ADDR,
        chainNameOrId: DID_ETHR_CHAIN_ID,
        txSigner,
      });

      await did.setAttribute("did/svc/test", externalId, 86400, 2100000, {
        gasLimit: 2100000,
        gasPrice: 0,
      });

      res.status(200).json({
        keypair,
        did,
      });
    } catch (e) {
      console.log(e);
      res.status(500).json(e);
    }
  })
);

app.get(
  "/:did",
  AsyncHandler(async function (req: Request, res: Response) {
    const { did } = req.params;

    const resolver = new Resolver(
      getResolver({
        networks: [
          {
            name: "kimchi",
            provider,
            registry: DID_ETHR_REGISTRY_ADDR,
            chainId: DID_ETHR_CHAIN_ID,
          },
        ],
      })
    );

    const document = (await resolver.resolve(did)).didDocument;

    res.status(200).json({
      document,
    });
  })
);

app.get("/", Status);
app.use(ErrorHandler);

module.exports = app;
