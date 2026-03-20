"use client";

import { useState } from "react";
import Link from "next/link";

export function AddPipelineButton() {
  return (
    <Link
      href="/layer2-information/lineage/new"
      className="bg-navy-600 hover:bg-navy-500 rounded px-4 py-2 text-sm font-medium text-white"
    >
      Add Pipeline
    </Link>
  );
}
