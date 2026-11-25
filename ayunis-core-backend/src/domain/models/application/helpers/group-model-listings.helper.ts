import type { ProviderModelListing } from 'src/domain/models/application/models/provider-model-listing';

export interface GroupedModelListing {
  /** The identifier to store: a fixed version whenever the provider has one. */
  name: string;
  identifiers: string[];
  listing: ProviderModelListing;
}

export function groupModelListings(
  listings: readonly ProviderModelListing[],
): GroupedModelListing[] {
  return collectGroups(listings).map((group) => {
    const identifiers = [...new Set(group.flatMap(identifiersOf))];
    const name = selectName(group, identifiers);
    return {
      name,
      identifiers,
      listing: group.find((entry) => entry.id === name) ?? group[0],
    };
  });
}

const identifiersOf = (listing: ProviderModelListing): string[] => [
  listing.id,
  ...listing.aliases,
];

// Entries sharing any identifier describe one model.
function collectGroups(
  listings: readonly ProviderModelListing[],
): ProviderModelListing[][] {
  let groups: { identifiers: Set<string>; entries: ProviderModelListing[] }[] =
    [];
  for (const listing of listings) {
    const identifiers = identifiersOf(listing);
    const matches = groups.filter((group) =>
      identifiers.some((id) => group.identifiers.has(id)),
    );
    const merged = {
      identifiers: new Set([
        ...matches.flatMap((group) => [...group.identifiers]),
        ...identifiers,
      ]),
      entries: [...matches.flatMap((group) => group.entries), listing],
    };
    groups = [...groups.filter((group) => !matches.includes(group)), merged];
  }
  return groups.map((group) => group.entries);
}

/**
 * A `-latest` alias can move to another model while the catalog entry keeps its
 * price and capabilities, so it is stored only when nothing else exists.
 */
function selectName(
  group: readonly ProviderModelListing[],
  identifiers: readonly string[],
): string {
  const fixed = identifiers.filter((id) => !id.endsWith('-latest'));
  const preferred = [
    ...group.map((entry) => entry.billingName),
    ...group.map((entry) => entry.name),
  ].find((candidate) => candidate && fixed.includes(candidate));
  // The longest identifier carries the most precise version.
  const mostPrecise = [...fixed]
    .sort((a, b) => b.length - a.length || a.localeCompare(b))
    .at(0);
  return preferred ?? mostPrecise ?? identifiers[0];
}
