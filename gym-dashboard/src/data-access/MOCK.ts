"use server";

import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function insertMockData() {
	try {
		await insertMockEmployees();
		await insertMockAccounts();
		console.log("Data inserted successfully!");
	} catch (error) {
		console.error("Error inserting data:", error);
	}
}

const employees = [
	{
		taxCode: "ABCDEF12G34H567E",
		name: "John",
		surname: "Doe",
		birthDate: new Date("1985-07-20"),
		street: "Main St",
		houseNumber: "123",
		city: "City",
		province: "Province",
		phoneNumber: "1234567890",
		email: "john.doe@example.com",
		hiringDate: new Date("2022-01-01"),
	},
	{
		taxCode: "GHIJKL34M56N769O",
		name: "Jane",
		surname: "Smith",
		birthDate: new Date("1990-10-15"),
		street: "Second St",
		houseNumber: "456",
		city: "Town",
		province: "Region",
		phoneNumber: "0987654321",
		email: "jane.smith@example.com",
		hiringDate: new Date("2023-02-01"),
	},
	{
		taxCode: "PQRSTU56V77W901X",
		name: "Alice",
		surname: "Brown",
		birthDate: new Date("1982-05-10"),
		street: "Third St",
		houseNumber: "789",
		city: "Village",
		province: "Area",
		phoneNumber: "1122334455",
		email: "alice.brown@example.com",
		hiringDate: new Date("2021-03-15"),
	},
	{
		taxCode: "VWXYZ12A37B567C",
		name: "Bob",
		surname: "Johnson",
		birthDate: new Date("1979-11-30"),
		street: "Fourth St",
		houseNumber: "101",
		city: "Metropolis",
		province: "Zone",
		phoneNumber: "5566778899",
		email: "bob.johnson@example.com",
		hiringDate: new Date("2020-12-20"),
	},
	{
		taxCode: "LMNOP778R90S123T",
		name: "Charlie",
		surname: "Williams",
		birthDate: new Date("1983-08-25"),
		street: "Fifth St",
		houseNumber: "202",
		city: "Hamlet",
		province: "State",
		phoneNumber: "6677889900",
		email: "charlie.williams@example.com",
		hiringDate: new Date("2019-07-05"),
	},
	{
		taxCode: "CDEFGH15I34J567K",
		name: "Eve",
		surname: "Davis",
		birthDate: new Date("1987-04-17"),
		street: "Sixth St",
		houseNumber: "303",
		city: "Borough",
		province: "County",
		phoneNumber: "7788990011",
		email: "eve.davis@example.com",
		hiringDate: new Date("2018-04-22"),
	},
	{
		taxCode: "FGHIJK35L56M789N",
		name: "Frank",
		surname: "Miller",
		birthDate: new Date("1980-02-20"),
		street: "Seventh St",
		houseNumber: "404",
		city: "Municipality",
		province: "District",
		phoneNumber: "8899001122",
		email: "frank.miller@example.com",
		hiringDate: new Date("2017-01-18"),
	},
	{
		taxCode: "NOPQRS56T58U901V",
		name: "Grace",
		surname: "Wilson",
		birthDate: new Date("1991-06-13"),
		street: "Eighth St",
		houseNumber: "505",
		city: "Commune",
		province: "Territory",
		phoneNumber: "9900112233",
		email: "grace.wilson@example.com",
		hiringDate: new Date("2016-11-29"),
	},
	{
		taxCode: "QRSTUV58W90X012Y",
		name: "Henry",
		surname: "Moore",
		birthDate: new Date("1989-09-24"),
		street: "Ninth St",
		houseNumber: "606",
		city: "Citystate",
		province: "Region",
		phoneNumber: "1011121314",
		email: "henry.moore@example.com",
		hiringDate: new Date("2015-10-16"),
	},
	{
		taxCode: "WXYZ12A34B56CCDE",
		name: "Ivy",
		surname: "Taylor",
		birthDate: new Date("1984-03-29"),
		street: "Tenth St",
		houseNumber: "707",
		city: "Township",
		province: "Province",
		phoneNumber: "1213141516",
		email: "ivy.taylor@example.com",
		hiringDate: new Date("2014-09-21"),
	},
];
async function insertMockEmployees() {
	for (const employee of employees) {
		await db.employee.create({
			data: employee,
		});
	}
}

const accounts = [
	{ username: "2johndoe", password: "password123", role: Role.Employee, approved: true },
	{ username: "2janesmith", password: "password456", role: Role.Employee, approved: false },
	{ username: "2alicebrown", password: "password789", role: Role.Employee, approved: true },
	{ username: "2bobjohnson", password: "password101", role: Role.Employee, approved: true },
	{ username: "2charliewilliams", password: "password112", role: Role.Employee, approved: false },
	{ username: "2evedavis", password: "password131", role: Role.Employee, approved: true },
	{ username: "2frankmiller", password: "password415", role: Role.Employee, approved: false },
	{ username: "2gracewilson", password: "password161", role: Role.Employee, approved: true },
	{ username: "2henrymoore", password: "password718", role: Role.Employee, approved: true },
	{ username: "2ivytaylor", password: "password192", role: Role.Employee, approved: false },
];
async function insertMockAccounts() {
	let lastId =
		(
			await db.employee.findMany({
				orderBy: { id: "desc" },
				take: 1,
			})
		)[0].id -
		employees.length +
		1;
	for (const account of accounts) {
		await db.account.create({
			data: { ...account, employeeId: lastId++ },
		});
	}
}
