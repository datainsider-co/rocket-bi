<template>
  <div class="upload-container" :class="{ dragover: isDragOver, 'has-error': error }" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    <input @change="onChangeFile" ref="file" type="file" class="d-none" />
    <div class="upload-body d-flex flex-column text-center w-100 h-100 justify-content-center">
      <img class="mx-auto mb-4" src="../../assets/icons/upload.svg" alt="Upload Icon" width="40" height="40" />
      <div>DRAG AND DROP FILE</div>
      <div>Drop a document or</div>
      <a @click.prevent="browserLocalFiles" href="#" class="color-di-primary">browse your CSV files</a>
      <div class="text-danger mt-2">
        {{ error }}
        <span>&nbsp;</span>
      </div>
    </div>
  </div>
</template>
<script src="./BrowseFile.js"></script>
