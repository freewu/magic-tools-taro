// 血型遗传（ABO 系统）估算
//
// 用中国人群大致基因频率（IA≈0.21 / IB≈0.14 / i≈0.65）按孟德尔方式推算子代表型概率；
// 罕见亚型 / 孟买型等特殊情形忽略不计。

export const TYPE_NAMES: string[] = ['A 型', 'B 型', 'AB 型', 'O 型']

export type BloodChild = {
  typeName: string
  /** 概率百分比，保留一位小数 */
  pct: number
}

const P_A = 0.21
const P_B = 0.14
const P_O = 0.65

/**
 * 某表型下的基因型权重（未归一），索引对应基因型的等位基因构成，
 * 与 `allelesOf` 返回的顺序一一对应。
 */
function genotypeWeights(phen: number): number[] {
  if (phen === 0) {
    // AA / AO
    return [P_A * P_A, 2 * P_A * P_O]
  }
  if (phen === 1) {
    // BB / BO
    return [P_B * P_B, 2 * P_B * P_O]
  }
  if (phen === 2) {
    // AB
    return [2 * P_A * P_B]
  }
  // OO
  return [P_O * P_O]
}

/** 第 idx 个基因型遗传给后代的等位基因概率 [A, B, O] */
function allelesOf(phen: number, idx: number): number[] {
  if (phen === 3) {
    return [0, 0, 1]
  }
  if (phen === 2) {
    return [0.5, 0.5, 0]
  }
  if (phen === 0) {
    return idx === 0 ? [1, 0, 0] : [0.5, 0, 0.5]
  }
  return idx === 0 ? [0, 1, 0] : [0, 0.5, 0.5]
}

export function calcChildren(father: number, mother: number): BloodChild[] {
  const pWeights = genotypeWeights(father)
  const mWeights = genotypeWeights(mother)
  const pSum = pWeights.reduce((a, b) => a + b, 0)
  const mSum = mWeights.reduce((a, b) => a + b, 0)

  // 子代表型累计：0=A 1=B 2=AB 3=O
  const child: number[] = [0, 0, 0, 0]

  for (let pi = 0; pi < pWeights.length; pi++) {
    for (let mi = 0; mi < mWeights.length; mi++) {
      const w = ((pWeights[pi] / pSum) * mWeights[mi]) / mSum
      const pa = allelesOf(father, pi)
      const ma = allelesOf(mother, mi)
      const gAA = pa[0] * ma[0]
      const gAB = pa[0] * ma[1] + pa[1] * ma[0]
      const gAi = pa[0] * ma[2] + pa[2] * ma[0]
      const gBB = pa[1] * ma[1]
      const gBi = pa[1] * ma[2] + pa[2] * ma[1]
      const gii = pa[2] * ma[2]
      child[0] += (gAA + gAi) * w
      child[1] += (gBB + gBi) * w
      child[2] += gAB * w
      child[3] += gii * w
    }
  }

  const order: number[] = [0, 1, 2, 3]
  order.sort((a, b) => child[b] - child[a])

  const result: BloodChild[] = []
  for (let i = 0; i < order.length; i++) {
    const pct = Math.round(child[order[i]] * 1000) / 10
    // 概率为 0 的血型不可能出现，不列入
    if (pct > 0) {
      result.push({ typeName: TYPE_NAMES[order[i]], pct })
    }
  }
  return result
}
