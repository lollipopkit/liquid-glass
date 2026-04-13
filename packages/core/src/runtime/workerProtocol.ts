import type {
  LiquidGlassFilterParamInput,
  LiquidGlassFilterParams,
} from "../filter";

export type WorkerRenderTask = "displacement" | "specular" | "magnifying";

export type WorkerRenderRequest = {
  dpr: number;
  id: number;
  input: LiquidGlassFilterParamInput;
  tasks: WorkerRenderTask[];
  type: "render";
};

export type WorkerWarmupRequest = {
  id: number;
  type: "warmup";
};

export type WorkerDisplacementRender = {
  blob: Blob;
  maxDisplacement: number;
};

export type WorkerSpecularRender = {
  blob: Blob;
};

export type WorkerMagnifyingRender = {
  blob?: Blob;
  magnify: boolean;
};

export type WorkerRenderResponse = {
  displacement?: WorkerDisplacementRender;
  dpr: number;
  id: number;
  magnifying?: WorkerMagnifyingRender;
  params: LiquidGlassFilterParams;
  specular?: WorkerSpecularRender;
  type: "render";
};

export type WorkerErrorResponse = {
  id: number;
  message: string;
  name?: string;
  type: "error";
};

export type WorkerWarmupResponse = {
  id: number;
  type: "warmup";
};

export type WorkerRequest = WorkerRenderRequest | WorkerWarmupRequest;

export type WorkerResponse =
  | WorkerErrorResponse
  | WorkerRenderResponse
  | WorkerWarmupResponse;
