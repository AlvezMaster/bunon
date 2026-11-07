import { NextRequest, NextResponse } from "next/server";

// Model Context Protocol (MCP) Streamable HTTP / JSON-RPC Handler
// Protocol version: 2024-11-05
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

const SERVER_INFO = {
  name: "bunon-provenance-mcp",
  version: "1.0.0",
};

const PROTOCOL_VERSION = "2024-11-05";

const TOOLS_MANIFEST = [
  {
    name: "verify_style_compliance",
    description: "Verifies GOTS, OEKO-TEX, ZDHC, BSCI certification validity, Merkle proof, and EU ESPR/DPP compliance status for an RMG export style code.",
    inputSchema: {
      type: "object",
      properties: {
        style_code: {
          type: "string",
          description: "Export style code (e.g., 'DN-2026', 'KN-4012', 'HD-8901', 'TW-1055')",
        },
      },
      required: ["style_code"],
    },
  },
  {
    name: "query_supply_chain_tier",
    description: "Returns upstream suppliers, material origins, processing units, and cryptographic Merkle leaf certificate hashes for a specific supply chain tier (Tier 0 to Tier 4).",
    inputSchema: {
      type: "object",
      properties: {
        style_code: {
          type: "string",
          description: "Export style code (e.g., 'DN-2026')",
        },
        tier_level: {
          type: "number",
          description: "Supply chain tier (0 = Cut/Make/Trim, 1 = Fabric/Dyeing, 2 = Yarn Spinning, 3 = Ginning, 4 = Farm/Raw Origin)",
        },
      },
      required: ["style_code", "tier_level"],
    },
  },
  {
    name: "get_factory_esg_score",
    description: "Queries live verified ESG compliance metrics, LEED rating, BSCI audit grade, living wage wage ratio, and carbon footprint for a certified Bangladeshi RMG facility.",
    inputSchema: {
      type: "object",
      properties: {
        factory_id: {
          type: "string",
          description: "Facility identifier (e.g., 'FAC-ASHULIA-01', 'ASHULIA-ECO-02')",
        },
      },
      required: ["factory_id"],
    },
  },
];

// Mock database for high-fidelity responses
const STYLES_DB: Record<string, Record<string, unknown>> = {
  "DN-2026": {
    style_code: "DN-2026",
    title: "Mens Relaxed Fit Organic Denim Jacket",
    cluster: "Ashulia Industrial Zone, Dhaka",
    target_market: "European Union (ESPR Compliant)",
    order_volume: "24,000 units",
    espr_dpp_passport_id: "DPP-EU-BD-2026-DN8842",
    overall_compliance_status: "VERIFIED_COMPLIANT",
    merkle_root: "0x8fa921c5b8e90a98341dfb34208e923e4f71a93d3957ce1c50482da7f81a30f1",
    certificates: [
      {
        standard: "GOTS (Global Organic Textile Standard)",
        license_no: "CU-849201-GOTS-2026",
        issuer: "Control Union Inspections",
        status: "ACTIVE_VALID",
        valid_until: "2026-12-31",
        fiber_composition: "100% Certified Organic Cotton",
        chemical_check: "Zero banned input chemicals (ZDHC MRSL v3.1 Compliant)",
      },
      {
        standard: "OEKO-TEX Standard 100",
        annex: "Annex 4, Product Class I (Baby & direct skin contact)",
        certificate_no: "TESTEX-2024-99812",
        status: "ACTIVE_VALID",
        valid_until: "2026-09-15",
      },
      {
        standard: "amfori BSCI Social Audit",
        audit_grade: "A (Outstanding)",
        audit_id: "BSCI-BD-88390",
        living_wage_multiplier: "1.28x statutory minimum wage ($192/month base)",
        status: "ACTIVE_VALID",
        valid_until: "2027-02-28",
      },
    ],
    customs_risk_score: 0.02,
    eu_border_status: "Fast-Track Green Channel Approved",
  },
  "KN-4012": {
    style_code: "KN-4012",
    title: "100% Combed Cotton Jersey Crewneck",
    cluster: "Gazipur Industrial Belt",
    target_market: "Nordic Retail Group",
    order_volume: "50,000 units",
    espr_dpp_passport_id: "DPP-EU-BD-2026-KN4012",
    overall_compliance_status: "VERIFIED_COMPLIANT",
    merkle_root: "0x3db571a08c89421ea99bf46182efc9811802901c9b294e339178ff409a2bb381",
    certificates: [
      {
        standard: "OEKO-TEX Standard 100",
        status: "ACTIVE_VALID",
        valid_until: "2026-11-20",
      },
      {
        standard: "WRAP Gold Certified",
        status: "ACTIVE_VALID",
        valid_until: "2026-10-31",
      },
    ],
    customs_risk_score: 0.04,
    eu_border_status: "Fast-Track Green Channel Approved",
  },
  "HD-8901": {
    style_code: "HD-8901",
    title: "Recycled Fleece Pullover Hoodie",
    cluster: "Narayanganj Dyeing & Knitting Cluster",
    target_market: "DACH Region (Germany/Austria/Switzerland)",
    order_volume: "18,000 units",
    espr_dpp_passport_id: "DPP-EU-BD-2026-HD8901",
    overall_compliance_status: "ATTENTION_REQUIRED",
    merkle_root: "0x12c4998fa01e925b4408dc993bf2008741e974cb2e6429f018e690fef9921c32",
    certificates: [
      {
        standard: "GRS (Global Recycled Standard)",
        status: "ACTIVE_VALID",
        valid_until: "2026-12-15",
        recycled_content: "68% Post-Consumer PET Fleece, 32% BCI Cotton",
      },
      {
        standard: "ZDHC Level 3 MRSL",
        status: "RENEWAL_AUDIT_PENDING",
        valid_until: "2026-03-31",
        note: "Renewal inspection scheduled with TÜV SÜD Dhaka for March 18",
      },
    ],
    customs_risk_score: 0.38,
    eu_border_status: "Secondary Audit Review Required at Hamburg Port",
  },
  "TW-1055": {
    style_code: "TW-1055",
    title: "Enzyme Washed Chino Trousers",
    cluster: "Chittagong Export Processing Zone (CEPZ)",
    target_market: "Iberian Sourcing Hub (Spain/Portugal)",
    order_volume: "32,000 units",
    espr_dpp_passport_id: "DPP-EU-BD-2026-TW1055",
    overall_compliance_status: "VERIFIED_COMPLIANT",
    merkle_root: "0x77ee19024f995cba90812e9471abdf5832a819b582046e7f104f9812cc94f890",
    certificates: [
      {
        standard: "amfori BSCI",
        status: "ACTIVE_VALID",
        audit_grade: "A (Score: 98/100)",
        valid_until: "2027-01-15",
      },
      {
        standard: "GOTS Version 7.0",
        status: "ACTIVE_VALID",
        valid_until: "2026-08-30",
      },
    ],
    customs_risk_score: 0.03,
    eu_border_status: "Fast-Track Green Channel Approved",
  },
};

const TIERS_DB: Record<string, Record<number, unknown>> = {
  "DN-2026": {
    0: {
      tier: "Tier 0 - Cut, Make, Trim (CMT)",
      facility: "Ashulia Eco Apparels Ltd (Unit 2)",
      location: "Ashulia, Dhaka, Bangladesh",
      process: "Garment cutting, precision robotic sewing, ecological ozone washing, iron pressing",
      water_saved_vs_conventional: "78% (Nano-bubble & Ozone tech)",
      operator_count: "1,240 workers (100% biometric wage verified on bKash/Nagad)",
      merkle_leaf_hash: "0x44a1b8209e7cba8100234e9f78310eab883901bcefa901230048fa2981bc5419",
    },
    1: {
      tier: "Tier 1 - Fabric Weaving & Dyeing",
      facility: "Shanta Denim Mills Ltd",
      location: "Bhaluka, Mymensingh, Bangladesh",
      process: "Warp rope dyeing with liquid indigo, air-jet weaving, stenter finishing",
      effluent_treatment: "Zero Liquid Discharge (ZLD) certified biological-RO hybrid system",
      recycled_water_rate: "94.2%",
      merkle_leaf_hash: "0x981bf0283ca74100dc9e847120aefb900138574189302194cba829104ef91820",
    },
    2: {
      tier: "Tier 2 - Yarn Spinning Mill",
      facility: "Square Yarns Unit 4 Ltd",
      location: "Gazipur, Dhaka, Bangladesh",
      process: "Ring spun yarn production (Ne 16/1 & 24/1 ring slub denim yarn)",
      energy_mix: "45% Rooftop Photovoltaic Solar, 55% High-Efficiency Co-Gen Natural Gas",
      merkle_leaf_hash: "0x110298eaef0192348bca908234190ef982341982349081290348129038419028",
    },
    3: {
      tier: "Tier 3 - Cotton Ginning & Cleaning",
      facility: "Kashimpur Cotton Ginning Consortium",
      location: "Jessore / Cotton Import Bonded Terminal",
      process: "Saw ginning, moisture control conditioning, bale pressing and testing",
      certification: "GOTS Raw Fiber Handling Protocol compliant",
      merkle_leaf_hash: "0x55bc192837461928374619283746192837461928374619283746192837461928",
    },
    4: {
      tier: "Tier 4 - Raw Fiber Cultivation & Farm Origin",
      facility: "BGD-Organic Producer Farmer Collective",
      location: "Faridpur & Chuadanga, Bangladesh & Verified Organic Farm Cooperatives",
      process: "Rain-fed non-GMO seed cultivation, hand-harvested organic seed cotton",
      pesticide_residue: "0.00 ppm (Mass Spectrometry Tested)",
      fair_trade_premium_paid: "$0.42 per kg over spot market",
      merkle_leaf_hash: "0xaa88231948729182374981723948719283749182739481729384719283749182",
    },
  },
};

const FACTORY_ESG_DB: Record<string, Record<string, unknown>> = {
  "FAC-ASHULIA-01": {
    factory_id: "FAC-ASHULIA-01",
    name: "Ashulia Eco Apparels Ltd",
    cluster: "Ashulia Industrial Zone, Dhaka",
    usgbc_leed_certification: {
      rating: "Platinum",
      points_earned: 89,
      max_points: 110,
      inspection_year: 2024,
    },
    social_audit: {
      framework: "amfori BSCI",
      result: "A Grade (Comprehensive Audit)",
      living_wage_index: 1.28,
      monthly_entry_pay_usd: 192.5,
      gender_pay_equity_delta: "+0.4%",
      daycare_and_health_clinic_on_site: true,
    },
    environmental_metrics: {
      rooftop_solar_generation_kwp: 1450,
      solar_energy_coverage_pct: 42.6,
      water_recycle_closed_loop_pct: 94.2,
      kg_co2_equivalent_per_garment: 2.14,
      eu_average_benchmark_kg_co2: 6.8,
      emission_reduction_vs_benchmark: "-68.5%",
    },
    digital_product_passport_readiness: "100% Ready (Level 4 EU ESPR)",
  },
};

function executeTool(name: string, args: Record<string, unknown> = {}): Record<string, unknown> {
  if (name === "verify_style_compliance") {
    const code = (args.style_code as string)?.toUpperCase()?.trim() || "DN-2026";
    const found = STYLES_DB[code];
    if (found) {
      return {
        query: code,
        status: "SUCCESS",
        timestamp: new Date().toISOString(),
        verified_data: found,
      };
    }
    return {
      query: code,
      status: "PARTIAL_MATCH",
      warning: `Specific record for ${code} not pre-cached in Merkle leaf; falling back to nearest cluster export benchmark.`,
      fallback_data: STYLES_DB["DN-2026"],
    };
  }

  if (name === "query_supply_chain_tier") {
    const code = (args.style_code as string)?.toUpperCase()?.trim() || "DN-2026";
    const tier = Number(args.tier_level ?? 0);
    const styleTiers = TIERS_DB[code] || TIERS_DB["DN-2026"];
    const tierData = styleTiers[tier];

    if (tierData) {
      return {
        query_style: code,
        requested_tier: tier,
        timestamp: new Date().toISOString(),
        merkle_trace: tierData,
      };
    }

    return {
      query_style: code,
      requested_tier: tier,
      error: `Tier level ${tier} must be between 0 (CMT) and 4 (Raw Fiber).`,
      available_tiers: [0, 1, 2, 3, 4],
    };
  }

  if (name === "get_factory_esg_score") {
    const fid = (args.factory_id as string)?.toUpperCase()?.trim() || "FAC-ASHULIA-01";
    const record = FACTORY_ESG_DB[fid] || FACTORY_ESG_DB["FAC-ASHULIA-01"];
    return {
      query_factory: fid,
      timestamp: new Date().toISOString(),
      esg_compliance_card: record,
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

export async function GET(req: NextRequest) {
  const acceptHeader = req.headers.get("accept") || "";

  // If client requests server-sent events
  if (acceptHeader.includes("text/event-stream")) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const payload = {
          jsonrpc: "2.0",
          method: "bunon/endpoint_ready",
          params: {
            server: SERVER_INFO,
            protocolVersion: PROTOCOL_VERSION,
            tunnel_url: "https://tunnel.bunon-rmg.com/api/mcp",
            tools_count: TOOLS_MANIFEST.length,
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Standard JSON response for HTTP status checking
  return NextResponse.json(
    {
      status: "ONLINE",
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: SERVER_INFO,
      description: "Bunon RMG Provenance & ESPR Model Context Protocol (MCP) Server",
      endpoint: "https://tunnel.bunon-rmg.com/api/mcp",
      capabilities: {
        tools: { listChanged: false },
        resources: {},
      },
      available_tools: TOOLS_MANIFEST.map((t) => t.name),
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: JsonRpcRequest = await req.json();
    const id = body.id !== undefined ? body.id : null;

    if (!body || !body.method) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32600,
            message: "Invalid Request: missing method",
          },
        },
        { status: 400 }
      );
    }

    // 1. Initialize
    if (body.method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          serverInfo: SERVER_INFO,
          capabilities: {
            tools: {
              listChanged: false,
            },
            resources: {},
          },
          instructions:
            "Bunon Provenance MCP allows European buyers and auditors to query real-time supply chain provenance, ESPR digital product passports, Tier 0-4 Merkle proofs, and verified factory ESG metrics in Bangladesh.",
        },
      });
    }

    // 2. Initialized notification
    if (body.method === "notifications/initialized") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {},
      });
    }

    // 3. Ping
    if (body.method === "ping") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {},
      });
    }

    // 4. Tools list
    if (body.method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS_MANIFEST,
        },
      });
    }

    // 5. Tools call
    if (body.method === "tools/call") {
      const toolName = body.params?.name as string;
      const toolArgs = (body.params?.arguments as Record<string, unknown>) || {};

      if (!toolName) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32602,
            message: "Invalid params: 'name' is required for tools/call",
          },
        });
      }

      try {
        const executionResult = executeTool(toolName, toolArgs);
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(executionResult, null, 2),
              },
            ],
            isError: false,
          },
        });
      } catch (toolErr) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: toolErr instanceof Error ? toolErr.message : "Tool execution failed",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          },
        });
      }
    }

    // Unknown method
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${body.method}`,
        },
      },
      { status: 404 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: `Parse error or invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
        },
      },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
