<style src="asciinema-player/dist/bundle/asciinema-player.css">
</style>

<script setup>
import * as AsciinemaPlayer from 'asciinema-player';

import { onMounted, ref } from "vue";

const props = defineProps(['data']);

const playerRef = ref(null)

onMounted(() => {
  AsciinemaPlayer.create(props.data, playerRef.value, {
    theme: 'dracula'
  });
})
</script>

<template>
  <div ref="playerRef"></div>
</template>
