import { useCallback, useEffect, useState } from "react";

interface EntityActions<T, K extends keyof T> {
	getAll: () => Promise<T[]>;
	deleteAction: (entity: Pick<T, K>) => Promise<T>;
	editAction: (entity: T) => Promise<T>;
}

type EntityKey<T> = keyof T;

export function useEntityData<T, K extends EntityKey<T>>(
	actions: EntityActions<T, K>,
	identifierKeys: K[]
) {
	const [data, setData] = useState<T[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		const fetchedData = await actions.getAll();
		setData(fetchedData);
		setIsLoading(false);
	}, [actions]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleDelete = useCallback(
		async (deletedEntity: Pick<T, K>) => {
			await actions.deleteAction(deletedEntity);
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
			await actions.editAction(editedEntity);
			setData((prevData) =>
				prevData.map((item) =>
					identifierKeys.every((key) => item[key] === editedEntity[key])
						? editedEntity
						: item
				)
			);
		},
		[actions, identifierKeys]
	);

	return { data, setData, isLoading, handleDelete, handleEdit };
}
