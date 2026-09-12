import { useCallback, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../api/client";

export default function FarmerListScreen({ navigation }) {
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchFarmers = async (searchTerm = search) => {
    const res = await api.get("/farmers", { params: { search: searchTerm, limit: 50 } });
    setFarmers(res.data.data);
  };

  useFocusEffect(useCallback(() => { fetchFarmers(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFarmers();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search farmers..."
        value={search}
        onChangeText={(v) => { setSearch(v); fetchFarmers(v); }}
      />
      <FlatList
        data={farmers}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No farmers found</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("FarmerDetails", { id: item._id })}>
            <Text style={styles.cardTitle}>{item.farmerName}</Text>
            <Text style={styles.cardSub}>{item.mobileNumber} · {item.address?.district || "-"}</Text>
            <Text style={styles.cardSub}>{item.plantationCount ?? 0} plantation(s)</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("FarmerForm", {})}>
        <Text style={styles.fabText}>+ Add Farmer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7f3", padding: 12 },
  search: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#ddd" },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 14, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1f2a1f" },
  cardSub: { fontSize: 13, color: "#667", marginTop: 2 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
  fab: { backgroundColor: "#2f6d3c", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  fabText: { color: "#fff", fontWeight: "700" },
});
