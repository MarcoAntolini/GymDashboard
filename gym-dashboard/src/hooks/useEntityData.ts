import { useCallback, useEffect, useState } from "react";

interface EntityActions<T, K extends keyof T> {
	getAll: () => Promise<T[]>;
	deleteAction?: (entity: Pick<T, K>) => Promise<T>;
	editAction?: (entity: T) => Promise<T>;
}

type EntityKey<T> = keyof T;

function toError(error: unknown, fallback: string): Error {
	if (error instanceof Error && error.message.trim()) {
		return error;
	}
	return new Error(fallback);
}

export function useEntityData<T, K extends EntityKey<T>>(
	actions: EntityActions<T, K>,
	identifierKeys: K[]
) {
	const [data, setData] = useState<T[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const fetchedData = await actions.getAll();
			setData(fetchedData);
		} catch (err) {
			setError(toError(err, "Impossibile caricare i dati. Riprova."));
		} finally {
			setIsLoading(false);
		}
	}, [actions]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleDelete = useCallback(
		async (deletedEntity: Pick<T, K>) => {
			if (actions.deleteAction) {
				await actions.deleteAction(deletedEntity);
			}
			setData((prevData) =>
				prevData.filter((item) =>
					identifierKeys.every((key) => item[key] !== deletedEntity[key])
				)
			);
		},
		[actions, identifierKeys]
	);

	const handleEdit = useCallback(
		async (editedEntity: T) => {
			const saved =
				actions.editAction != null ? await actions.editAction(editedEntity) : editedEntity;
			setData((prevData) =>
				prevData.map((item) =>
					identifierKeys.every((key) => item[key] === editedEntity[key]) ? saved : item
				)
			);
		},
		[actions, identifierKeys]
	);

	return { data, setData, isLoading, error, retry: fetchData, handleDelete, handleEdit };
}
