"use client";

import { useState } from "react";
import Link from "next/link";

export function AddPipelineButton() {
  return (
    <Link
      href="/layer2-information/lineage/new"
      className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
    >
      Add Pipeline
    </Link>
  );
}
