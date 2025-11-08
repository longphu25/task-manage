import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";

function DebugComponent() {
    const account = useCurrentAccount();
	const { data, isPending, error, refetch } = useSuiClientQuery('getOwnedObjects', {
		owner: account?.address || '0x123',
	});

	if (isPending) {
		return <div>Loading...</div>;
	}

	return <pre>{JSON.stringify(data, null, 2)}</pre>;
}